/**
 * table — genuine data table (the D10 exception). Renders authored block rows
 * as a real <table>. Variant `plain` = the source site's borderless legal
 * table (td padding 15, full width).
 */
export default async function decorate(block) {
  const table = document.createElement('table');
  const tbody = document.createElement('tbody');
  [...block.children].forEach((row) => {
    const tr = document.createElement('tr');
    [...row.children].forEach((cell) => {
      const td = document.createElement('td');
      td.append(...cell.childNodes);
      tr.append(td);
    });
    tbody.append(tr);
  });
  table.append(tbody);
  block.replaceChildren(table);
}
