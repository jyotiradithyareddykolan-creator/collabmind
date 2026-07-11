import ReactMarkdown from "react-markdown";

// Renders markdown text with hand-styled Tailwind classes (no @tailwindcss/typography plugin)
export default function MarkdownText({ children, className = "" }) {
  return (
    <div className={`text-sm leading-relaxed ${className}`}>
      <ReactMarkdown
        components={{
          p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
          strong: ({ node, ...props }) => (
            <strong className="font-semibold text-paper-soft" {...props} />
          ),
          em: ({ node, ...props }) => <em className="italic" {...props} />,
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-outside pl-5 mb-2 space-y-1" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-outside pl-5 mb-2 space-y-1" {...props} />
          ),
          li: ({ node, ...props }) => <li className="text-paper-soft" {...props} />,
          h1: ({ node, ...props }) => (
            <h1 className="text-base font-semibold text-paper-soft mt-2 mb-1" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-sm font-semibold text-paper-soft mt-2 mb-1" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-sm font-medium text-paper-soft mt-2 mb-1" {...props} />
          ),
          code: ({ node, inline, ...props }) =>
            inline ? (
              <code className="bg-white/10 px-1 py-0.5 rounded text-xs font-mono" {...props} />
            ) : (
              <code
                className="block bg-white/5 rounded-md p-2 text-xs font-mono overflow-x-auto"
                {...props}
              />
            ),
          a: ({ node, ...props }) => (
            <a className="text-signal underline hover:no-underline" {...props} />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}