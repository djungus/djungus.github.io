/* ========== Book Detail Modal ========== */
const modal = document.getElementById('book-modal');
const backdrop = document.getElementById('modal-backdrop');
const closeBtn = document.getElementById('modal-close');

function openModal(data) {
  document.getElementById('modal-title').textContent = data.title;
  document.getElementById('modal-author').textContent = 'by ' + data.author;
  document.getElementById('modal-notes').textContent = data.notes || 'No notes yet.';

  const rating = document.getElementById('modal-rating');
  rating.textContent = data.rating || '';

  const status = document.getElementById('modal-status');
  status.textContent = data.status === 'reading' ? 'Currently Reading'
    : data.status === 'finished' ? 'Finished'
    : 'Want to Read';
  status.className = 'modal-status ' + (data.status || 'to-read');

  const preview = document.getElementById('modal-preview');
  preview.style.background = data.color;
  preview.style.backgroundImage = 'none';
  preview.innerHTML = '<span style="color:rgba(255,255,255,0.5);font-size:0.8rem;text-align:center;padding:10px;display:block;margin-top:50px;">Loading cover...</span>';

  // Fetch cover from Open Library
  const query = encodeURIComponent(`${data.title} ${data.author}`);
  fetch(`https://openlibrary.org/search.json?q=${query}&limit=1`)
    .then(res => res.json())
    .then(json => {
      preview.innerHTML = '';
      if (json.docs && json.docs.length > 0 && json.docs[0].cover_i) {
        const coverUrl = `https://covers.openlibrary.org/b/id/${json.docs[0].cover_i}-L.jpg`;
        preview.style.backgroundImage = `url('${coverUrl}')`;
        preview.style.backgroundSize = 'cover';
        preview.style.backgroundPosition = 'center';
      } else {
        preview.innerHTML = '<span style="color:rgba(255,255,255,0.5);font-size:0.8rem;text-align:center;padding:10px;display:block;margin-top:50px;">No cover found</span>';
      }
    })
    .catch(err => {
      preview.innerHTML = '';
      console.error('Failed to load cover:', err);
    });

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

backdrop.addEventListener('click', closeModal);
closeBtn.addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// Shelf books
document.querySelectorAll('.book').forEach(book => {
  book.addEventListener('click', () => {
    openModal({
      title: book.dataset.title,
      author: book.dataset.author,
      status: book.dataset.status,
      rating: book.dataset.rating,
      notes: book.dataset.notes,
      color: getComputedStyle(book).getPropertyValue('--book-color').trim()
    });
  });
});

// Pile books
document.querySelectorAll('.pile-book').forEach(book => {
  book.addEventListener('click', () => {
    openModal({
      title: book.dataset.title,
      author: book.dataset.author,
      status: 'to-read',
      rating: '',
      notes: book.dataset.notes,
      color: getComputedStyle(book).getPropertyValue('--pile-color').trim()
    });
  });
});
