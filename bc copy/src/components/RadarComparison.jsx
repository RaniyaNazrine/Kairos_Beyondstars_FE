/**
 * Radar / comparison chart for restaurants.
 * Uses simple CSS-based bars when recharts is unavailable.
 */
const DIMENSIONS = ["ambiance", "service", "food_quality", "value", "location"];
const COLORS = [
  "bg-purple-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-amber-500",
  "bg-rose-500",
];

const RadarComparison = ({ restaurants }) => {
  if (!restaurants || restaurants.length === 0) return null;

  return (
    <div className="mt-4 space-y-6">
      {restaurants.map((r) => {
        const scores = r.meta?.scores || {};
        return (
          <div
            key={r.id}
            className="bg-white rounded-xl p-5 shadow-md border border-gray-100"
          >
            <h4 className="text-md font-bold text-gray-900 mb-3">{r.name}</h4>
            <div className="space-y-2">
              {DIMENSIONS.map((dim, idx) => {
                const value = scores[dim] ?? 0;
                return (
                  <div key={dim} className="flex items-center gap-3">
                    <span className="w-24 text-xs text-gray-600 capitalize">
                      {dim.replace("_", " ")}
                    </span>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${COLORS[idx]} transition-all duration-500`}
                        style={{ width: `${Math.min(value, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-8 text-right">
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>
            {r.allergy_warnings?.length > 0 && (
              <div className="mt-2 text-xs text-red-600">
                {r.allergy_warnings.map((w, i) => (
                  <span key={i}>
                    {w.emoji} {w.title}
                    {i < r.allergy_warnings.length - 1 ? " · " : ""}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RadarComparison;
