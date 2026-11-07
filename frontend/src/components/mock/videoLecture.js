// Suggested questions for the backend's demo video
// ("Independence, Basis, and Dimension", MIT OpenCourseWare).
// Used instead of the eigenvector demo questions when a backend is connected.
export const videoQuestions = [
  "What is a basis?",
  "What does it mean for vectors to be independent?",
  "What is the dimension of a subspace?",
  "What does span mean?",
  "Why was [6, 3, 5] a bad choice for the third vector?",
  "Why is [1, 0, 0] a better third vector?",
  "Can two vectors span all of R3?",
  "Can four vectors in R3 be independent?",
  "If a matrix has independent columns, what is its null space?",
  "Is a plane through the origin the same as R2?",
  "What are the possible dimensions of subspaces of R3?",
  "Does a subspace have only one basis?",
].map((question, index) => ({ questionId: `video-${String(index + 1).padStart(2, "0")}`, question }));
