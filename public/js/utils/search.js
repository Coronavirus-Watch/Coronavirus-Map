let searchInput = document.querySelector('#search');
let searchLink = document.querySelector('#searchLink');
let searchPlaceholder = '/country.html?search=';
searchInput.addEventListener('keyup', e => {
	searchLink.href = `${searchPlaceholder}${searchInput.value}`;
});
