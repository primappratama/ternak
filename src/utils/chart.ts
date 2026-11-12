export type Point = { x: number; y: number };

/** Path SVG garis lurus antar titik: "M x y L x y ..." */
export function toLinePath(points: Point[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

/** Panjang total garis. Dipakai untuk animasi "tergambar" lewat strokeDashoffset. */
export function polylineLength(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return total;
}
