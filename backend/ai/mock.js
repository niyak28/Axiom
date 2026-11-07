export const mockTranscript = "Today we look at eigenvectors. A matrix A scales a vector v without changing its direction when A v equals lambda v.";
export const mockAnswer = {
  aiAnswer: "The professor said an eigenvector keeps its direction under the matrix; it is only scaled by lambda.",
  quote: "scales a vector v without changing its direction",
  resolved: true,
};
export const mockVisual = {
  frameType: "matrix",
  data: { matrix: [[2, 0], [0, 3]], coordinates: [{ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }], label: "Diagonal scaling matrix" },
};

export const mockYouTubeSegments = [
  { startSec: 0, endSec: 12, text: "Welcome back. Today we're going to talk about eigenvectors and eigenvalues." },
  { startSec: 12, endSec: 28, text: "Take a matrix A. Most vectors get knocked off their span when you multiply by A." },
  { startSec: 28, endSec: 45, text: "But some special vectors stay on their own span. A only scales them. Those are the eigenvectors." },
  { startSec: 45, endSec: 62, text: "[writes A v = lambda v] The amount it scales by, lambda, is called the eigenvalue." },
  { startSec: 62, endSec: 80, text: "For a diagonal matrix like two zero, zero three, the basis vectors are eigenvectors with eigenvalues two and three." },
  { startSec: 80, endSec: 98, text: "To find them in general we solve the determinant of A minus lambda I equals zero." },
];
