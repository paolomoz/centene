/**
 * form — contact form (source: AEM forms POST).
 *
 * Authoring rows:
 *   1. action row: a single link = the submission endpoint (D4: fully qualified)
 *   2..N-1. field rows: label | type (text/email/textarea) | name | required?
 *   N. submit row: single text cell = the button label
 *
 * The submission endpoint and reCAPTCHA site key are client decisions
 * (dynamic-blocks-map § integrations); until then the form posts to the
 * authored endpoint without a captcha token.
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const actionLink = rows[0] ? rows[0].querySelector('a') : null;
  const action = actionLink ? actionLink.href : '#';
  const fieldRows = rows.slice(1, -1);
  const submitLabel = rows.length > 1 ? rows[rows.length - 1].textContent.trim() : 'Submit';

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = action;
  form.enctype = 'multipart/form-data';
  form.className = 'cmp-form';

  fieldRows.forEach((row, i) => {
    const [labelC, typeC, nameC, reqC] = [...row.children].map((c) => c.textContent.trim());
    const type = (typeC || 'text').toLowerCase();
    const name = nameC || `field_${i}`;
    const required = /yes|true|required|\*/.test(reqC || '');
    const wrap = document.createElement('div');
    wrap.className = 'form-field';
    const label = document.createElement('label');
    label.setAttribute('for', `f-${name}`);
    label.textContent = labelC + (required ? ' *' : '');
    let input;
    if (type === 'textarea') {
      input = document.createElement('textarea');
      input.rows = 5;
    } else {
      input = document.createElement('input');
      input.type = type === 'email' ? 'email' : 'text';
    }
    input.id = `f-${name}`;
    input.name = name;
    if (required) input.required = true;
    wrap.append(label, input);
    form.append(wrap);
  });

  const btnWrap = document.createElement('div');
  btnWrap.className = 'form-actions';
  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.className = 'btn site-btn';
  btn.textContent = submitLabel;
  btnWrap.append(btn);
  form.append(btnWrap);

  block.replaceChildren(form);
}
