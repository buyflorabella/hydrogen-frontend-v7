import { useLoaderData, Link, type LoaderFunctionArgs } from 'react-router';
import { useState, useEffect } from 'react';
import { Clock, ArrowLeft, Share2, Bookmark, User, Calendar } from 'lucide-react';
import AnnouncementBar from '../componentsMockup2/components/AnnouncementBar';
import { useSavedItems } from '../componentsMockup2/contexts/SavedItemsContext';
import { useFeatureFlags } from '../componentsMockup2/contexts/FeatureFlagsContext';


const renderContentBlock = (block: string, idx: number, tocIndex: number) => {
  if (block.startsWith('[VIDEO:') && block.endsWith(']')) {
    const videoUrl = block.replace('[VIDEO:', '').replace(']', '').trim();
    const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
    const isVimeo = videoUrl.includes('vimeo.com');

    let embedUrl = videoUrl;
    if (isYouTube) {
      const videoId = videoUrl.includes('youtu.be')
        ? videoUrl.split('youtu.be/')[1]?.split('?')[0]
        : videoUrl.split('v=')[1]?.split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (isVimeo) {
      const videoId = videoUrl.split('vimeo.com/')[1]?.split('?')[0];
      embedUrl = `https://player.vimeo.com/video/${videoId}`;
    }

    return (
      <div key={idx} className="my-8 bg-gray-50 rounded-2xl overflow-hidden shadow-lg border border-gray-200">
        <div className="relative pb-[56.25%]">
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  if (block.startsWith('> ')) {
    return (
      <blockquote key={idx} className="my-8 pl-6 border-l-4 border-[#7cb342] bg-gradient-to-r from-[#7cb342]/5 to-transparent py-4 pr-6 rounded-r-2xl">
        <p className="text-gray-700 text-xl italic leading-relaxed">
          {block.replace('> ', '')}
        </p>
      </blockquote>
    );
  }

  if (block.startsWith('### ')) {
    const title = block.replace('### ', '');
    const id = `heading-${idx}-${title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
    return (
      <h3 key={idx} id={id} className="text-2xl font-bold text-gray-900 mt-10 mb-4 flex items-center gap-3 scroll-mt-32">
        <span className="w-1 h-8 bg-[#7cb342] rounded-full"></span>
        {title}
      </h3>
    );
  }

  if (block.startsWith('## ')) {
    const title = block.replace('## ', '');
    const id = `heading-${idx}-${title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
    return (
      <h2 key={idx} id={id} className="text-3xl md:text-4xl font-bold text-gray-900 mt-12 mb-6 pb-4 border-b-2 border-gray-200 scroll-mt-32">
        {title}
      </h2>
    );
  }

  if (block.startsWith('# ')) {
    return (
      <h1 key={idx} className="text-4xl md:text-5xl font-bold text-gray-900 mt-12 mb-6">
        {block.replace('# ', '')}
      </h1>
    );
  }

  if (block.startsWith('- ') || block.startsWith('* ')) {
    const items = block.split('\n').filter(line => line.startsWith('- ') || line.startsWith('* '));
    return (
      <ul key={idx} className="my-6 space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-gray-700 text-lg leading-relaxed">
            <span className="w-2 h-2 bg-[#7cb342] rounded-full mt-2 flex-shrink-0"></span>
            <span>{item.replace(/^[*-] /, '')}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (block.startsWith('[IMAGE:') && block.endsWith(']')) {
    const imageParts = block.replace('[IMAGE:', '').replace(']', '').split('|');
    const imageUrl = imageParts[0].trim();
    const caption = imageParts[1]?.trim();

    return (
      <figure key={idx} className="my-8">
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg">
          <img src={imageUrl} alt={caption || ''} className="w-full h-auto" />
        </div>
        {caption && (
          <figcaption className="mt-3 text-center text-gray-600 italic text-sm">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  if (block.trim().length === 0) {
    return null;
  }

  return (
    <p key={idx} className="text-gray-700 text-lg leading-relaxed mb-6">
      {block}
    </p>
  );
};



interface ShopifyImage {
  url: string;
  altText: string | null;
}

interface ArticleNode {
  id: string;
  title: string;
  handle: string;
  contentHtml: string;
  excerpt: string;
  tags: string[];
  publishedAt: string;
  authorV2: { name: string } | null;
  image: ShopifyImage | null;
  blog: {
    handle: string;
    title: string;
  };
}

export async function loader({ params, context }: LoaderFunctionArgs) {
  const { blogHandle, articleHandle } = params;
  const { storefront } = context;

  if (!blogHandle || !articleHandle) {
    throw new Response('Missing blog or article handle', { status: 400 });
  }

  const { blog } = await storefront.query(ARTICLE_QUERY, {
    variables: {
      blogHandle,
      articleHandle,
    },
  });

  if (!blog?.articleByHandle) {
    console.error(`Article not found for blog: ${blogHandle}, article: ${articleHandle}`);
    throw new Response('Article Not Found', { status: 404 });
  }

  return { article: blog.articleByHandle };
}

const calculateReadTime = (html: string) => {
  const text = html.replace(/<[^>]*>?/gm, '');
  const words = text.split(/\s+/).length;
  return Math.ceil(words / 200) || 1;
};

export default function ArticlePage() {
  const { article } = useLoaderData<{ article: ArticleNode }>();
  const [tableOfContents, setTableOfContents] = useState<
    Array<{ id: string; title: string; level: number }>
  >([]);
  const { isSaved, toggleSave } = useSavedItems();
  const { flags } = useFeatureFlags();

  // Build TOC after rendering
  useEffect(() => {
    const timer = setTimeout(() => {
      const contentElement = document.getElementById('article-content');
      if (!contentElement) return;

      const headings = Array.from(contentElement.querySelectorAll('h2, h3'));
      const toc = headings.map((heading, idx) => {
        const id = heading.id || `heading-${idx}`;
        heading.setAttribute('id', id);
        heading.classList.add('scroll-mt-32');
        return {
          id,
          title: heading.textContent || '',
          level: heading.tagName === 'H2' ? 2 : 3,
        };
      });

      setTableOfContents(toc);
    }, 50);
    return () => clearTimeout(timer);
  }, [article.contentHtml]);

  return (
    <>
      <AnnouncementBar />
      {/* Top image + article container */}
      <div className="bg-gray-50">
        {article.image && (
          <div className="w-full h-[400px] md:h-[500px] relative overflow-hidden">
            <img
              src={article.image.url}
              alt={article.image.altText || article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="max-w-7xl mx-auto px-6 py-12">
          <Link to="/learn" className="inline-flex items-center gap-2 text-gray-600 hover:text-[#7cb342] mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to Articles (2-DxB was here article.$blogHandle.$articleHandle.tsx)
          </Link>
          
          <div className="bg-white border border-gray-200 shadow-lg rounded-3xl overflow-hidden mb-8">
            <div className="p-8 md:p-12">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-[#7cb342] text-sm font-semibold uppercase tracking-wide">
                  {article.blog.title}
                </span>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{calculateReadTime(article.contentHtml)} min read</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {article.title}
              </h1>
              <div className="flex items-center gap-4">
                <img
                  src={article.author_image}
                  alt={article.authorV2?.name || 'Staff'}
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-gray-900 font-semibold">
                    <User className="w-4 h-4" />
                    {article.authorV2?.name || 'Staff'}
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Calendar className="w-4 h-4" />
                    {new Date(article.publishedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="p-2 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors">
                    <Share2 className="w-5 h-5 text-gray-700" />
                  </button>
                  {flags.bookmarkIcon && (
                    <button
                      onClick={() => article && toggleSave({
                        id: article.id,
                        type: 'article',
                        title: article.title,
                        url: `/learn/${article.handle}`,
                        image: article.image.url,
                      })}
                      className={`p-2 border border-gray-200 rounded-lg transition-all ${
                        isSaved(article?.id || '') ? 'bg-[#7cb342] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                      title={isSaved(article?.id || '') ? 'Remove from saved' : 'Save article'}
                    >
                      <Bookmark className={`w-5 h-5 ${isSaved(article?.id || '') ? 'fill-current' : ''}`} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full h-[400px] md:h-[500px]">
              {article.image && (
                <img src={article.image.url} className="w-full h-full object-cover" alt={article.title} />
              )}            
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_320px] gap-8">
            {/* Left column: Article */}
            <article id="article-content" className="space-y-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                {article.title}
              </h1>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-[#7cb342] text-sm font-semibold uppercase tracking-wide">
                  {article.blog.title}
                </span>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{calculateReadTime(article.contentHtml)} min read</span>
                </div>
              </div>

              {/* Render content HTML */}
              <div
                dangerouslySetInnerHTML={{ __html: article.contentHtml }}
                className="prose prose-lg max-w-full text-gray-700"
              />
            </article>

            {/* Right column: TOC */}
            <aside className="sticky top-32 self-start">
              <div className="bg-white border border-gray-200 shadow-md rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Table of Contents
                </h3>
                <nav className="space-y-2">
                  {tableOfContents.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block ${
                        item.level === 3 ? 'pl-4 text-gray-600' : 'text-gray-700 font-semibold'
                      } text-sm hover:text-[#7cb342]`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(item.id)?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start',
                        });
                      }}
                    >
                      {item.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}

const ARTICLE_QUERY = `#graphql
  query GetArticle($blogHandle: String!, $articleHandle: String!) {
    blog(handle: $blogHandle) {
      articleByHandle(handle: $articleHandle) {
        id
        title
        contentHtml
        excerpt
        publishedAt
        tags
        authorV2 { name }
        image { url, altText }
        blog { handle, title }
      }
    }
  }
`;