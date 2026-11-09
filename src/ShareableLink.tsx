import {useState} from 'react'
import {Check, Copy, Share2} from 'lucide-react'
import './shareable-links.css'

/** All sharing uses the item's one canonical URL. */
export function ShareableLink({href,title,compact=false,hideViewLink=false}:{
  href: string
  title: string
  compact?: boolean
  hideViewLink?: boolean
}) {
  const [message,setMessage]=useState('')
  const absoluteUrl='https://pinkskybeauty.com'+(href.startsWith('/')?href:'/'+href)

  async function copyLink() {
    try {
      if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(absoluteUrl)
      setMessage('Link copied')
    } catch {
      setMessage('Copy this URL: '+absoluteUrl)
    }
  }

  async function share() {
    if(!navigator.share){await copyLink();return}
    try {
      await navigator.share({title,url:absoluteUrl})
      setMessage('')
    } catch(error) {
      if((error as Error)?.name!=='AbortError')await copyLink()
    }
  }

  return <div className={'pinksky-share-actions'+(compact?' pinksky-share-compact':'')}>
    {!hideViewLink&&<a className='pinksky-page-link' href={href} title={'View '+title}>{compact?'Open page':'View this page'}</a>}
    <button className='pinksky-share-copy' type='button' onClick={()=>void copyLink()}
      aria-label={'Copy link for '+title} title={'Copy '+absoluteUrl}>
      {message==='Link copied'?<Check size={16} aria-hidden='true'/>:<Copy size={16} aria-hidden='true'/>}
      <span>Copy link</span>
    </button>
    {!compact&&<button className='pinksky-share-copy' type='button' onClick={()=>void share()}>
      <Share2 size={16} aria-hidden='true'/><span>Share</span>
    </button>}
    {message&&<span className='pinksky-share-feedback' role='status'>{message}</span>}
  </div>
}
