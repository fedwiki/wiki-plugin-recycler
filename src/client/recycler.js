/*
 * Federated Wiki : Recycler Plugin
 * Licensed under the MIT license.
 */

const escape = line => {
  return line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const listItemHtml = (slug, title) => {
  return `
    <li>
      <a class="internal" href="#" title="recycler" data-page-name="${slug}" data-site="recycler">${escape(title)}</a>
      <button class="delete">✕</button>
    </li>
  `
}

const emit = ($item, item) => {
  wiki.recycler.get('system/slugs.json', (error, data) => {
    if (error) {
      $item.append(`
        <p style="background-color:#eee;padding:15px;">
          Unable to fetch contents of recycler
        </p>
      `)
    } else if (data.length === 0) {
      $item.append(`
        <p style="background-color:#eee;padding:15px;">
          The recycler is empty
        </p>
      `)
    } else {
      const ul = $('<ul>')
      $item.append(ul)
      for (let i = 0; i < data.length; i++) {
        const slug = data[i].slug
        const title = data[i].title ? data[i].title : data[i].slug
        ul.append(listItemHtml(slug, title))
      }
      if (data.length > 0) {
        $item.append(`
          <ul><button class="empty">Empty Recyler</button></ul>
        `)
      }
    }
  })
}

const deleteItem = (slug, item) => {
  const myInit = {
    method: 'DELETE',
    cache: 'no-cache',
    mode: 'same-origin',
    credentials: 'include',
  }

  return fetch(slug, myInit)
    .then(response => {
      if (response.ok) {
        const recyclerList = $(item).parent().parent()
        $(item).parent().remove()

        if (recyclerList.children().length === 0) {
          recyclerList.empty()
          recyclerList.append(`
            <p style="background-color:#eee;padding:15px;">
              The recycler is empty
            </p>
            `)
        }
      }
      return response
    })
    .catch(error => {
      console.log('recycler error: ', error)
      throw error
    })
}

const bind = ($item, item) => {
  // Handle single delete
  $item.on('click', '.delete', function () {
    const slug = '/recycler/' + $(this).siblings('a.internal').data('pageName') + '.json'
    deleteItem(slug, this).catch(error => console.log('recycler error: ', error))
  })

  // Handle empty all
  $item.on('click', '.empty', function () {
    const recycleElements = $(this).parent().parent().children().first()

    const deletePromises = Array.from($(recycleElements).children()).map(child => {
      const slug = '/recycler/' + $(child).children('a.internal').data('pageName') + '.json'
      const delButton = $(child).children('.delete')
      return deleteItem(slug, delButton)
    })

    Promise.allSettled(deletePromises).catch(error => console.log('recycler error: ', error))
  })
}

if (window) {
  window.plugins.recycler = { emit, bind }
}
