/**
 * portrait — floated inline portrait (source: float-right div + inline
 * max-width on news pages). Single row: image cell (optional caption cell).
 */
export default async function decorate(block) {
  const img = block.querySelector('picture img, img');
  if (img) img.setAttribute('loading', 'lazy');
}
