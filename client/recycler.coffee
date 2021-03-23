###
 Federated Wiki : Recycler Plugin
 Licensed under the MIT license.
###

queue = require 'async/queue'


escape = (line) ->
  line
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

listItemHtml = (slug, title) ->
  """
    <li>
      <a class="internal" href="#" title="recycler" data-page-name="#{slug}" data-site="recycler">#{escape title}</a>
      <button class="delete">✕</button>
    </li>
  """

emit = ($item, item) ->
  recycledPages = []
  wiki.recycler.get 'system/slugs.json', (error, data) ->
    if error
      $item.append """
        <p style="background-color:#eee;padding:15px;">
          Unable to fetch contents of recycler
        </p>
      """
    else if data.length is 0
      $item.append """
        <p style="background-color:#eee;padding:15px;">
          The recycler is empty
        </p>
      """
    else
      $item.append( ul = $('<ul>') )
      for i in [0...data.length]
        slug = data[i].slug
        if data[i].title?
          title = data[i].title
        else
          title = data[i].slug
        ul.append listItemHtml(slug, title)
      if data.length > 0
        $item.append """
          <ul><button class="empty">Empty Recyler</button></ul>
        """



bind = ($item, item) ->
  q = queue( (task, cb) ->
    myInit = {
      method: 'DELETE'
      cache: 'no-cache'
      mode: 'same-origin'
      credentials: 'include'
    }
    fetch task.slug, myInit
    .then (response) ->
      if response.ok
        recyclerList = $(task.item).parent().parent()
        $(task.item).parent().remove()

        if $(recyclerList).children().length is 0
          # no pages left in recycler so show message for empty recycler
          $item.empty()
          $item.append """
            <p style="background-color:#eee;padding:15px;">
              The recycler is empty
            </p>
          """
    .then cb()
  , 2) # just 2 processes working on the queue

  $item.on 'click', '.delete', ->
    slug = '/recycler/' + $(this).siblings('a.internal').data('pageName') + '.json'
    q.push {slug: slug
    item: this}, (err) ->
      if err
        console.log "recycler error: ", err

  $item.on 'click', '.empty', ->
    recycleElements = $(this).parent().parent().children().first()
    $(recycleElements).children().each( () ->
      slug = '/recycler/' + $(this).children('a.internal').data('pageName') + '.json'
      delButton = $(this).children('delete')
      q.push {slug: slug
      item: delButton}, (err) ->
        if err
          console.log 'recycler error: ', err
    )





window.plugins.recycler = {emit, bind} if window?
module.exports = {escape} if module?
