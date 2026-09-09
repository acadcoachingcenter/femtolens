function firstAuthorSurname(authors) {
  if (!authors) return 'Unknown'
  const first = authors.split(',')[0].trim()
  return first.split(' ')[0]
}

export function vancouver(paper) {
  const authors = paper.authors || 'Unknown authors'
  const title = paper.title?.replace(/\.$/, '') || 'Untitled'
  const journal = paper.journal || 'Unknown journal'
  const year = paper.year || 'n.d.'
  const idPart = paper.pmid ? ` PMID: ${paper.pmid}.` : ''
  const doiPart = paper.doi ? ` doi:${paper.doi}.` : ''
  return `${authors}. ${title}. ${journal}. ${year}.${doiPart}${idPart}`
}

export function bibtex(paper, index) {
  const key = `${firstAuthorSurname(paper.authors)}${paper.year || ''}_${index}`
  return [
    `@article{${key},`,
    `  title={${paper.title || ''}},`,
    `  author={${paper.authors || ''}},`,
    `  journal={${paper.journal || ''}},`,
    `  year={${paper.year || ''}},`,
    paper.doi ? `  doi={${paper.doi}},` : null,
    paper.pmid ? `  pmid={${paper.pmid}},` : null,
    `}`,
  ].filter(Boolean).join('\n')
}

export function ris(paper) {
  return [
    'TY  - JOUR',
    `TI  - ${paper.title || ''}`,
    ...(paper.authors ? paper.authors.split(',').map((a) => `AU  - ${a.trim()}`) : []),
    `JO  - ${paper.journal || ''}`,
    `PY  - ${paper.year || ''}`,
    paper.doi ? `DO  - ${paper.doi}` : null,
    paper.pmid ? `AN  - ${paper.pmid}` : null,
    'ER  - ',
  ].filter(Boolean).join('\n')
}

export function exportAll(papers, format) {
  if (format === 'bibtex') return papers.map((p, i) => bibtex(p, i)).join('\n\n')
  if (format === 'ris') return papers.map(ris).join('\n\n')
  return papers.map(vancouver).join('\n\n')
}
