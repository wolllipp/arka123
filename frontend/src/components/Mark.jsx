/* Знак АРКА 123, перерисованный вектором (viewBox 674×770) */

const DIGIT_2 = "M 252 406 L 252 376 A 51 51 0 1 1 342 409 L 240 614 L 381 614";
const DIGIT_3 = "M 416 327 L 578 327 L 459 466 A 78 78 0 1 1 414 537";

/** Знак, который умеет прорисовываться: одна линия арки + цифры отдельными группами */
export function AnimatedMark({ ref, className = "mark" }) {
  return (
    <svg ref={ref} className={className} viewBox="0 0 674 770" aria-hidden="true">
      <path className="stroke arch-line" pathLength="1" d="M 150 744 L 27 744 L 27 336 A 310 310 0 0 1 647 336 L 647 744 L 178 744" />
      <g className="digit">
        <rect x="150" y="304" width="55" height="466" className="fill" />
        <polygon points="135,304 151,304 151,364 84,364" className="fill" />
      </g>
      <g className="digit"><path className="stroke" d={DIGIT_2} /></g>
      <g className="digit"><path className="stroke" style={{ strokeLinejoin: "bevel" }} d={DIGIT_3} /></g>
    </svg>
  );
}

/** Статичный знак */
export function Mark({ className = "mark" }) {
  return (
    <svg className={className} viewBox="0 0 674 770" aria-hidden="true">
      <path d="M 0 744 L 674 744" className="stroke" />
      <path d="M 27 744 L 27 336 A 310 310 0 0 1 647 336 L 647 744" className="stroke" />
      <rect x="150" y="304" width="55" height="466" className="fill" />
      <polygon points="135,304 151,304 151,364 84,364" className="fill" />
      <path d={DIGIT_2} className="stroke" />
      <path d={DIGIT_3} className="stroke" style={{ strokeLinejoin: "bevel" }} />
    </svg>
  );
}
