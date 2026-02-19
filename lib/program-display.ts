export function programTypeToDisplay(programType: string): string {
  const upper = String(programType ?? "").trim().toUpperCase();
  if (upper === "PT") return "Poder Total";
  if (upper === "LT") return "Libertad Total";
  return programType;
}
