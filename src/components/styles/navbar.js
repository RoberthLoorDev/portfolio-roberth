// navbar.js
let isScrolled = false

function handleScroll() {
  const scrollPosition = window.pageYOffset
  const nav = document.querySelector('nav')

  if (!nav) return

  if (scrollPosition > 0 && !isScrolled) {
    nav.classList.add('bg-red-500')
    isScrolled = true
  } else if (scrollPosition === 0 && isScrolled) {
    nav.classList.remove('bg-red-500')
    isScrolled = false
  }
}

window.addEventListener('scroll', handleScroll)
