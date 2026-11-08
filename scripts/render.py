"""Render the shared Yomitan/Naminori glossary without network access."""
import re


def node(tag, content, **kwargs):
    return dict(tag=tag, content=content, **kwargs)


def example_nodes(text, head):
    # Reviewed readings for the auxiliary examples; no automatic kanji guesses.
    if head not in ('しちゃう','読んじゃった','ちまう','じゃう'):return text
    readings={'宿題':'しゅくだい','全部':'ぜんぶ','同じ':'おなじ','最後':'さいご','友達':'ともだち',
        '日記':'にっき','残り':'のこり','大事':'だいじ','手紙':'てがみ','約束':'やくそく',
        '先':'さき','食':'た','飲':'の','読':'よ','破':'やぶ','忘':'わす'}
    return [node('ruby',[part,node('rt',readings[part])]) if part in readings else part
        for part in re.split('('+'|'.join(map(re.escape,sorted(readings,key=len,reverse=True)))+')',text) if part]


def origin(row, variant):
    full = row['full']
    if not full: return None
    if variant['form'] == full:
        short = list(dict.fromkeys(v['form'] for v in row['variants'] if v['form'] != full))
        return ('Коротко: ' + ' / '.join(short)) if short else None
    if row['headword'] in ('しちゃう', '読んじゃった', 'ちまう', 'じゃう'):
        return 'Стяжение ' + full
    if row['full_form_status'] == 'word_formation_base': return 'Образовано от: ' + full
    if row['full_form_status'] == 'standard_counterpart': return 'Стандартная форма: ' + full
    return 'Сокращение: ' + full


def comparison(row,v):
    # Etymological components and independent slang are not expandable phrases.
    if not row['full'] or row['full_form_status']=='word_formation_base' or row['full']==v['form']:
        return []
    return [{'label':'Полная или стандартная форма','form':row['full'],'reading':row['reading']},
            {'label':'Выбранная форма','form':v['form'],'reading':v['reading']}]


def comparison_lines(row,v):
    # The native ⊞ grid describes valid reading/spelling pairs, not contractions.
    pair=comparison(row,v)
    return ['※ '+pair[0]['form']+' → '+pair[1]['form']] if pair else []


def examples(row,v,s):
    s=dict(s)
    if row['id']==1:
        s.update(example='手伝ってくれて、'+v['form']+'。',example_ru='Спасибо, что помог.')
    if row['headword']=='ちまう' and v['form']=='ちゃう' and any(w in s['meaning'] for w in ('непреднамеренно','ненамеренно')):
        s.update(example='約束を忘れちゃった。',example_ru='Позабыл об обещании.')
    if row['headword']=='ちまう' and v['form']=='ちまう' and 'завершить' in s['meaning']:
        s.update(example='先に食べちまうぞ。',example_ru='Я сейчас всё съем.')
    if s.get('example_node'):return s,s['example_node']
    jp=s.get('example','');needle=v['form']
    if needle not in jp and needle.endswith('う'):needle=needle[:-1]+'った'
    if needle and needle in jp:
        before,_,after=jp.partition(needle)
        return s,[example_nodes(before,row['headword']),node('span',example_nodes(needle,row['headword']),data={'content':'example-keyword'}),example_nodes(after,row['headword'])]
    return s,example_nodes(jp,row['headword'])


def notes(row,v):
    if row['full_form_status']=='not_applicable' and not row['full']:
        kind='выражение' if row['headword']=='それな' else 'слово'
        return ['Самостоятельное сленговое '+kind+'; полной формы нет.']
    if row.get('kolobok_evidence',{}).get('note') and v['form'] in ('ちゃう','じゃう'):
        return [row['kolobok_evidence']['note']]
    if comparison(row,v):
        return [p for p in row.get('formation_patterns',[]) if v['form'] in p]
    return [] if row['full']==v['form'] else ([origin(row,v)] if origin(row,v) else [])


def marked(tag,role,content,**kw):return node(tag,content,data={'content':role},**kw)


def usage(row,v):
    if row['id']==1:
        if v['form']==row['full']:return 'Вежливая благодарность; подходит для официального общения.'
        if v['form']=='ありがとう':return 'Обычная благодарность близким и знакомым; без вежливого окончания.'
        return 'Очень неформальная благодарность в непринуждённой компании. Не подходит для официального общения.'
    return row['context']


def format_marker(text):
    # CSS hides syntax in Yomitan; Naminori reads it while flattening the tree.
    return marked('span','format-marker',text)


def marked_keywords(value):
    if isinstance(value,list):return [marked_keywords(x) for x in value]
    if not isinstance(value,dict):return value
    result=dict(value)
    result['content']=marked_keywords(value.get('content',''))
    if value.get('data',{}).get('content')=='example-keyword':
        result['content']=[format_marker('<g>'),result['content'],format_marker('</g>')]
    return result


def universal_card(row,v,source,tags):
    """Valid Yomitan SC whose text is also valid native Naminori article syntax."""
    content=[]
    for i,s in enumerate(row['senses']):
        content.append(marked('div','sense',[marked('span','sense-number',str(i+1)+'. '),node('span',s['meaning'],lang='ru')]))
        if i==0:
            comparison_notes=comparison_lines(row,v)
            note_lines=comparison_notes+['※ '+n for n in notes(row,v) if '※ '+n not in comparison_notes]
            for line in note_lines:
                content.append(marked('div','sense-note',[format_marker('※ '),node('span',line[2:])]))
        s,jp=examples(row,v,s)
        if s.get('example'):
            content.append(marked('div','example-sentence',[
                marked('span','example-sentence-a',marked_keywords(jp),lang='ja'),
                format_marker(' ∥ '),
                marked('span','example-sentence-b',s['example_ru'],lang='ru')]))
    content.append(marked('div','sense-note',[format_marker('※ '),node('span',usage(row,v))]))
    return {'type':'structured-content','content':marked('div','jeosif-article',content)}
