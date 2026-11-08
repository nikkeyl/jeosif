// Shared Yomitan structured content and Naminori text markers.
const node = (tag, content, attributes = {}) => ({
  tag,
  content,
  ...attributes,
});
const marked = (tag, role, content, attributes = {}) =>
  node(tag, content, { data: { content: role }, ...attributes });
const marker = (text) => marked('span', 'format-marker', text);

function exampleNodes(text, headword) {
  if (
    !['しちゃう', '読んじゃった', 'ちまう', 'じゃう'].includes(headword)
  ) {
    return text;
  }
  const readings = {
    宿題: 'しゅくだい',
    全部: 'ぜんぶ',
    同じ: 'おなじ',
    最後: 'さいご',
    友達: 'ともだち',
    日記: 'にっき',
    残り: 'のこり',
    大事: 'だいじ',
    手紙: 'てがみ',
    約束: 'やくそく',
    先: 'さき',
    食: 'た',
    飲: 'の',
    読: 'よ',
    破: 'やぶ',
    忘: 'わす',
  };
  const pattern = new RegExp(
    `(${Object.keys(readings)
      .sort((a, b) => b.length - a.length)
      .join('|')})`,
  );
  return text
    .split(pattern)
    .filter(Boolean)
    .map((part) =>
      readings[part]
        ? node('ruby', [part, node('rt', readings[part])])
        : part,
    );
}

function origin(row, variant) {
  if (!row.full) return null;
  if (variant.form === row.full) {
    const forms = [
      ...new Set(
        row.variants.map((v) => v.form).filter((f) => f !== row.full),
      ),
    ];
    return forms.length ? `Коротко: ${forms.join(' / ')}` : null;
  }
  if (
    ['しちゃう', '読んじゃった', 'ちまう', 'じゃう'].includes(row.headword)
  ) {
    return `Стяжение ${row.full}`;
  }
  if (row.full_form_status === 'word_formation_base')
    return `Образовано от: ${row.full}`;
  if (row.full_form_status === 'standard_counterpart')
    return `Стандартная форма: ${row.full}`;
  return `Сокращение: ${row.full}`;
}

function comparison(row, variant) {
  return Boolean(
    row.full &&
    row.full_form_status !== 'word_formation_base' &&
    row.full !== variant.form,
  );
}

function notes(row, variant) {
  if (row.full_form_status === 'not_applicable' && !row.full) {
    const kind = row.headword === 'それな' ? 'выражение' : 'слово';
    return [`Самостоятельное сленговое ${kind}; полной формы нет.`];
  }
  if (
    row.kolobok_evidence?.note &&
    ['ちゃう', 'じゃう'].includes(variant.form)
  ) {
    return [row.kolobok_evidence.note];
  }
  if (comparison(row, variant)) {
    return (row.formation_patterns ?? []).filter((p) =>
      p.includes(variant.form),
    );
  }
  const value = row.full === variant.form ? null : origin(row, variant);
  return value ? [value] : [];
}

function usage(row, variant) {
  if (row.id !== 1) return row.context;
  if (variant.form === row.full)
    return 'Вежливая благодарность; подходит для официального общения.';
  if (variant.form === 'ありがとう')
    return 'Обычная благодарность близким и знакомым; без вежливого окончания.';
  return 'Очень неформальная благодарность в непринуждённой компании. Не подходит для официального общения.';
}

function example(row, variant, original) {
  const sense = { ...original };
  if (row.id === 1) {
    sense.example = `手伝ってくれて、${variant.form}。`;
    sense.example_ru = 'Спасибо, что помог.';
  }
  if (
    row.headword === 'ちまう' &&
    variant.form === 'ちゃう' &&
    ['непреднамеренно', 'ненамеренно'].some((word) =>
      sense.meaning.includes(word),
    )
  ) {
    sense.example = '約束を忘れちゃった。';
    sense.example_ru = 'Позабыл об обещании.';
  }
  if (
    row.headword === 'ちまう' &&
    variant.form === 'ちまう' &&
    sense.meaning.includes('завершить')
  ) {
    sense.example = '先に食べちまうぞ。';
    sense.example_ru = 'Я сейчас всё съем.';
  }
  if (sense.example_node) return [sense, sense.example_node];
  const japanese = sense.example ?? '';
  let needle = variant.form;
  if (!japanese.includes(needle) && needle.endsWith('う'))
    needle = `${needle.slice(0, -1)}った`;
  const position = needle ? japanese.indexOf(needle) : -1;
  if (position < 0) return [sense, exampleNodes(japanese, row.headword)];
  return [
    sense,
    [
      exampleNodes(japanese.slice(0, position), row.headword),
      marked('span', 'example-keyword', exampleNodes(needle, row.headword)),
      exampleNodes(japanese.slice(position + needle.length), row.headword),
    ],
  ];
}

function markedKeywords(value) {
  if (Array.isArray(value)) return value.map(markedKeywords);
  if (!value || typeof value !== 'object') return value;
  const result = { ...value, content: markedKeywords(value.content ?? '') };
  if (value.data?.content === 'example-keyword') {
    result.content = [marker('<g>'), result.content, marker('</g>')];
  }
  return result;
}

export function render(row, variant) {
  const content = [];
  row.senses.forEach((original, index) => {
    content.push(
      marked('div', 'sense', [
        marked('span', 'sense-number', `${index + 1}. `),
        node('span', original.meaning, { lang: 'ru' }),
      ]),
    );
    if (index === 0) {
      const comparisons = comparison(row, variant)
        ? [`※ ${row.full} → ${variant.form}`]
        : [];
      const lines = [
        ...comparisons,
        ...notes(row, variant)
          .filter((note) => !comparisons.includes(`※ ${note}`))
          .map((note) => `※ ${note}`),
      ];
      for (const line of lines) {
        content.push(
          marked('div', 'sense-note', [
            marker('※ '),
            node('span', line.slice(2)),
          ]),
        );
      }
    }
    const [sense, japanese] = example(row, variant, original);
    if (sense.example) {
      content.push(
        marked('div', 'example-sentence', [
          marked('span', 'example-sentence-a', markedKeywords(japanese), {
            lang: 'ja',
          }),
          marker(' ∥ '),
          marked('span', 'example-sentence-b', sense.example_ru, {
            lang: 'ru',
          }),
        ]),
      );
    }
  });
  content.push(
    marked('div', 'sense-note', [
      marker('※ '),
      node('span', usage(row, variant)),
    ]),
  );
  return {
    type: 'structured-content',
    content: marked('div', 'jeosif-article', content),
  };
}
