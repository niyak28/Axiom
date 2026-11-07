export const demoTranscript = [
  {
    text: "Today we are moving from transformations to the directions those transformations preserve.",
    symbol: "T(v) = Av",
    matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    eigenvalues: [1, 1, 1],
    comprehension: 0.78,
  },
  {
    text: "An eigenvector is a nonzero vector whose direction stays fixed after the transformation.",
    symbol: "Av = λv",
    matrix: [[2, 0, 0], [0, 1, 0], [0, 0, 1]],
    eigenvalues: [2, 1, 1],
    comprehension: 0.74,
  },
  {
    text: "The eigenvalue lambda tells us exactly how much that eigenvector is stretched, compressed, or reversed.",
    symbol: "λ ∈ ℝ",
    matrix: [[3, 0, 0], [0, 2, 0], [0, 0, 1]],
    eigenvalues: [3, 2, 1],
    comprehension: 0.71,
  },
  {
    text: "For lambda one, the vector is unchanged; values above one stretch it and values between zero and one compress it.",
    symbol: "0 < λ < 1",
    matrix: [[3, 0, 0], [0, 1.5, 0], [0, 0, 0.6]],
    eigenvalues: [3, 1.5, 0.6],
    comprehension: 0.68,
  },
  {
    text: "A negative eigenvalue also reverses direction, which we can see as a flip across the origin.",
    symbol: "λ < 0",
    matrix: [[-2, 0, 0], [0, 1.5, 0], [0, 0, 0.6]],
    eigenvalues: [-2, 1.5, 0.6],
    comprehension: 0.63,
  },
  {
    text: "To find eigenvalues, we move lambda v to the left and factor out the vector.",
    symbol: "(A − λI)v = 0",
    matrix: [[3, 0.2, 0], [0, 2, 0.1], [0, 0, 1]],
    eigenvalues: [3, 2, 1],
    comprehension: 0.59,
  },
  {
    text: "A nonzero solution exists only when A minus lambda I is singular.",
    symbol: "det(A − λI) = 0",
    matrix: [[3, 0.4, 0], [0, 2, 0.2], [0, 0, 1]],
    eigenvalues: [3, 2, 1],
    comprehension: 0.56,
  },
  {
    text: "The roots of this characteristic polynomial are the eigenvalues of A.",
    symbol: "p(λ) = det(A − λI)",
    matrix: [[3, 0.15, 0], [0, 2, 0.35], [0, 0, 1]],
    eigenvalues: [3, 2, 1],
    comprehension: 0.61,
  },
  {
    text: "For this diagonal matrix, we can read the three eigenvalues directly from the diagonal.",
    symbol: "A = diag(3, 2, 1)",
    matrix: [[3, 0, 0], [0, 2, 0], [0, 0, 1]],
    eigenvalues: [3, 2, 1],
    comprehension: 0.72,
  },
  {
    text: "Each coordinate axis is an eigendirection, and the visualization shows its independent scale factor.",
    symbol: "Aeᵢ = λᵢeᵢ",
    matrix: [[3.4, 0, 0], [0, 2.3, 0], [0, 0, 0.8]],
    eigenvalues: [3.4, 2.3, 0.8],
    comprehension: 0.77,
  },
  {
    text: "Repeated eigenvalues do not always provide enough independent eigenvectors to diagonalize a matrix.",
    symbol: "A = PDP⁻¹",
    matrix: [[2, 1, 0], [0, 2, 0], [0, 0, 1]],
    eigenvalues: [2, 2, 1],
    comprehension: 0.58,
  },
  {
    text: "The key idea is geometric: eigenvectors reveal the stable directions hidden inside a linear transformation.",
    symbol: "span(v) → span(v)",
    matrix: [[3, 0, 0], [0, 2, 0], [0, 0, 1]],
    eigenvalues: [3, 2, 1],
    comprehension: 0.75,
  },
];

export const demoQuestions = [
  ["What is an eigenvector?", "An eigenvector is a nonzero vector whose direction is preserved by a linear transformation. Its magnitude may change.", "An eigenvector is a nonzero vector whose direction stays fixed after the transformation."],
  ["What does an eigenvalue represent?", "The eigenvalue λ is the scale factor applied to its eigenvector: it can stretch, compress, reverse, or collapse that direction.", "The eigenvalue lambda tells us exactly how much that eigenvector is stretched, compressed, or reversed."],
  ["Can lambda be zero?", "Yes. λ = 0 means vectors in that eigenspace collapse to the zero vector, so the matrix is singular.", "A nonzero solution exists only when A minus lambda I is singular."],
  ["What happens when lambda is negative?", "The vector is scaled and its direction is reversed. Geometrically, it flips through the origin.", "A negative eigenvalue also reverses direction."],
  ["How do I find the eigenvalues?", "Solve the characteristic equation det(A − λI) = 0. Its roots are the eigenvalues.", "The roots of this characteristic polynomial are the eigenvalues of A."],
  ["Why do we set the determinant to zero?", "A nonzero eigenvector requires (A − λI)v = 0 to have nontrivial solutions, which happens only when A − λI is singular.", "A nonzero solution exists only when A minus lambda I is singular."],
  ["What is the characteristic polynomial?", "It is p(λ) = det(A − λI). The roots of this polynomial are the matrix's eigenvalues.", "The roots of this characteristic polynomial are the eigenvalues of A."],
  ["Are eigenvectors unique?", "No. Every nonzero scalar multiple of an eigenvector points along the same eigendirection and is also an eigenvector.", "Eigenvectors reveal the stable directions hidden inside a linear transformation."],
  ["Can the zero vector be an eigenvector?", "No. The definition explicitly requires a nonzero vector; otherwise Av = λv would be true for every λ.", "An eigenvector is a nonzero vector whose direction stays fixed after the transformation."],
  ["What does lambda one mean?", "λ = 1 means the transformation leaves that eigenvector unchanged in both direction and magnitude.", "For lambda one, the vector is unchanged."],
  ["What does an eigenvalue greater than one do?", "It stretches vectors in its eigendirection by that factor while preserving their direction.", "Values above one stretch it."],
  ["What does an eigenvalue between zero and one do?", "It compresses vectors in that eigendirection without reversing them.", "Values between zero and one compress it."],
  ["Why are diagonal matrices easier?", "Their coordinate axes are already eigendirections, so the diagonal entries are the eigenvalues.", "For this diagonal matrix, we can read the three eigenvalues directly from the diagonal."],
  ["What is an eigenspace?", "For a given λ, the eigenspace is the null space of A − λI, together with the zero vector.", "(A − λI)v = 0"],
  ["What is diagonalization?", "Diagonalization writes A = PDP⁻¹, where the columns of P are independent eigenvectors and D contains their eigenvalues.", "A = PDP⁻¹"],
  ["When is a matrix diagonalizable?", "An n × n matrix is diagonalizable when it has n linearly independent eigenvectors.", "Repeated eigenvalues do not always provide enough independent eigenvectors to diagonalize a matrix."],
  ["What is algebraic multiplicity?", "It is the number of times an eigenvalue occurs as a root of the characteristic polynomial.", "The roots of this characteristic polynomial are the eigenvalues of A."],
  ["What is geometric multiplicity?", "It is the dimension of the eigenspace associated with an eigenvalue.", "Eigenvectors reveal the stable directions hidden inside a linear transformation."],
  ["Can a repeated eigenvalue have one eigenvector?", "Yes. Its geometric multiplicity can be one even when its algebraic multiplicity is larger, making the matrix defective.", "Repeated eigenvalues do not always provide enough independent eigenvectors."],
  ["Why are eigenvectors useful?", "They expose invariant directions, making repeated transformations, differential equations, stability analysis, and data compression easier to understand.", "Eigenvectors reveal the stable directions hidden inside a linear transformation."],
].map(([question, aiAnswer, quote], index) => ({
  questionId: `demo-${String(index + 1).padStart(2, "0")}`,
  question,
  aiAnswer,
  quote,
  status: "resolved",
}));

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "can", "do", "does", "i", "is", "it", "of", "the",
  "to", "what", "when", "why",
]);

function tokens(value) {
  return value
    .toLowerCase()
    .replace(/[^\wλ]+/g, " ")
    .split(" ")
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

export function resolveDemoQuestion(input) {
  const inputTokens = tokens(input);
  const ranked = demoQuestions.map((item) => {
    const promptTokens = tokens(item.question);
    const overlap = inputTokens.filter((token) =>
      promptTokens.some((promptToken) =>
        promptToken === token ||
        (token.length > 4 && promptToken.startsWith(token.slice(0, -1))) ||
        (promptToken.length > 4 && token.startsWith(promptToken.slice(0, -1))),
      ),
    ).length;
    return { item, score: overlap / Math.max(promptTokens.length, 1) };
  });
  ranked.sort((a, b) => b.score - a.score);

  if (ranked[0]?.score > 0) return ranked[0].item;
  return {
    questionId: `demo-fallback-${Date.now()}`,
    question: input,
    aiAnswer: "I could not map that to a prepared demo answer. Try asking about eigenvalues, eigenvectors, diagonalization, multiplicity, or the determinant.",
    quote: "Eigenvectors reveal the stable directions hidden inside a linear transformation.",
    status: "resolved",
  };
}
