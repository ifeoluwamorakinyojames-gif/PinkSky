import {PortableText} from '@portabletext/react'
export default function ArticleBody({body}: {body: any[]}) {
  return <PortableText value={body}/>
}
