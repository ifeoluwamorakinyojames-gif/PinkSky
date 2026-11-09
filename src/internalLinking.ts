/** Contextual links for existing, published Sanity records.
 * No invented slugs and no duplicate URLs for SEO.
 */
export type LinkedService = {slug: string; name: string; short?: string; description?: string}
export type LinkedArticle = {slug: string; title: string; summary?: string}

const stop = new Set(['a','an','and','are','at','best','by','can','complete','for','from','get','guide','how','in','is','it','of','on','or','our','price','the','to','vs','warri','effurun','you','your','what','with','nigeria','pinksky','beauty','services','service','session','first','know','all','about'])
const topics: {pattern: RegExp; words: string[]}[] = [
  {pattern: /teeth|tooth|whiten|dental|scaling|polish|yellow/i,words:['teeth','tooth','whitening','whiten','dental','yellow','scaling','polishing','discolouration','stain','smile']},
  {pattern: /facial|skin|acne|face|glow/i,words:['facial','skin','skincare','acne','face','complexion','glow','cleansing']},
  {pattern: /nail|pedicure|manicure/i,words:['nail','nails','manicure','pedicure','cuticle','gel','acrylic']},
  {pattern: /massage|spa|relax|wellness/i,words:['massage','spa','wellness','relax','relaxation','body']},
  {pattern: /hair|braid|wig|dread|barb|styling|revamp/i,words:['hair','braid','braiding','wig','dread','barb','barbing','styling','revamp','natural']},
  {pattern: /lash|brow|microblad/i,words:['lash','lashes','extension','brow','microblading','eyebrow']},
]

function tokens(value:string): string[] {
  return (value.toLowerCase().match(/[a-z]{3,}/g)||[])
    .filter(word=>!stop.has(word))
}

function relatedScore(subject:string, candidateTitle:string, candidateSummary=''):number {
  const subjectTokens=new Set(tokens(subject))
  const candidateTitleTokens=new Set(tokens(candidateTitle))
  const candidateSummaryTokens=new Set(tokens(candidateSummary))
  let score=0
  subjectTokens.forEach(word=>{
    if(candidateTitleTokens.has(word)) score+=4
    else if(candidateSummaryTokens.has(word)) score+=1
  })
  for(const topic of topics) {
    if (!topic.pattern.test(subject)) continue
    const titleMatches=topic.words.filter(word=>candidateTitleTokens.has(word)).length
    if(titleMatches)score+=Math.min(titleMatches,4)*3
    else if(topic.words.some(word=>candidateSummaryTokens.has(word)))score+=1
  }
  return score
}

function uniqueBySlug<T extends {slug:string}>(rows:T[]):T[] {
  const seen=new Set<string>()
  return rows.filter(row=>{
    if(!row.slug||seen.has(row.slug))return false
    seen.add(row.slug)
    return true
  })
}

export function articlesForService(service:LinkedService, articles:LinkedArticle[], limit=4):LinkedArticle[] {
  const context=[service.name,service.slug].join(' ')
  return uniqueBySlug(articles)
    .map(item=>({item,score:relatedScore(context,item.title,item.summary)}))
    .filter(row=>row.score>=3)
    .sort((a,b)=>b.score-a.score||a.item.title.localeCompare(b.item.title))
    .slice(0,limit).map(row=>row.item)
}

export function servicesForArticle(article:LinkedArticle, services:LinkedService[], limit=3):LinkedService[] {
  const context=[article.title,article.slug].join(' ')
  return uniqueBySlug(services)
    .map(item=>({item,score:relatedScore(item.name+' '+item.slug,context,article.summary)}))
    .filter(row=>row.score>=3)
    .sort((a,b)=>b.score-a.score||a.item.name.localeCompare(b.item.name))
    .slice(0,limit).map(row=>row.item)
}

export function articlesForArticle(article:LinkedArticle, articles:LinkedArticle[],limit=3):LinkedArticle[] {
  const context=[article.title,article.slug].join(' ')
  return uniqueBySlug(articles)
    .filter(item=>item.slug!==article.slug)
    .map(item=>({item,score:relatedScore(context,item.title,item.summary)}))
    .filter(row=>row.score>=3)
    .sort((a,b)=>b.score-a.score||a.item.title.localeCompare(b.item.title))
    .slice(0,limit).map(row=>row.item)
}
