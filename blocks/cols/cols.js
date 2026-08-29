/**
 * cols — generic multi-column band (source: AEM columncontrol).
 * Each authoring row = one source column row; cells = columns.
 * Column count drives the float grid (2 → 50/50, 3 → thirds; a `wide-first`
 * variant renders 66/33). Body copy inside columns renders at the source's
 * rd-t-16 size by default.
 */
export default async function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('row', 'cc-row');
    const cells = [...row.children];
    cells.forEach((cell) => {
      let cls = 'colctrl-40';
      if (cells.length === 2) cls = block.classList.contains('wide-first') && cell === cells[0] ? 'colctrl-66' : (block.classList.contains('wide-first') ? 'colctrl-33' : 'colctrl-50');
      if (cells.length === 1) cls = 'colctrl-100';
      cell.classList.add(cls, 'cc-col');
    });
  });
}
