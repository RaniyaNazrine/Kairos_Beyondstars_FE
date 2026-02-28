/**
 * AllergyDangerBanner — MANDATORY safety-critical component.
 *
 * Renders flagged_restaurants from GenerativeUIPayload in a visually distinct
 * danger zone. Never silently drop these — it's a safety violation.
 */
const AllergyDangerBanner = ({ restaurants }) => {
  if (!restaurants || restaurants.length === 0) return null;

  return (
    <div className="border-2 border-red-600 bg-red-50 rounded-lg p-4 my-4">
      <h3 className="text-red-700 font-bold text-lg flex items-center gap-2">
        🚨 Allergy Warnings
      </h3>
      <p className="text-red-600 text-sm mb-3">
        These restaurants may not be safe based on your allergy profile.
      </p>
      {restaurants.map((r) => (
        <div
          key={r.id}
          className="border border-red-300 rounded-lg p-3 mb-2 bg-white"
        >
          <span className="font-semibold text-gray-900">{r.name}</span>
          {r.allergy_warnings?.map((w, i) => (
            <div key={i} className="text-sm text-red-700 mt-1">
              {w.emoji} <strong>{w.title}</strong> — {w.message}
              {w.confidence_note && (
                <span className="text-gray-500 italic ml-1">
                  ({w.confidence_note})
                </span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default AllergyDangerBanner;
