/**
 * Markdown-like text response with follow-up question chips.
 */
const TextResponse = ({ text, follow_up_questions, onFollowUp }) => {
  return (
    <div className="mt-4">
      <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">
        {text}
      </div>
      {follow_up_questions?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {follow_up_questions.map((q, i) => (
            <button
              key={i}
              onClick={() => onFollowUp?.(q)}
              className="text-sm bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full border border-primary-200 hover:bg-primary-100 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TextResponse;
