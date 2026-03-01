export function Hl({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const kws = q.split(/\s+/).filter(Boolean);
  const re = new RegExp(
    `(${kws.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi"
  );
  return (
    <>
      {text.split(re).map((p, i) =>
        re.test(p) ? (
          <mark key={i} className="bg-orange-500/25 text-orange-200 rounded px-0.5">{p}</mark>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

export function Desc({ text, q }: { text: string; q: string }) {
  const lines = text.split(" ｜ ").filter(Boolean);
  if (lines.length <= 1) return <Hl text={text} q={q} />;
  return (
    <ul className="space-y-1 list-none mt-1">
      {lines.map((line, i) => (
        <li key={i} className="text-[13px] text-gray-300 leading-relaxed pl-3 border-l-2 border-[#2a3040]">
          <Hl text={line.trim()} q={q} />
        </li>
      ))}
    </ul>
  );
}
