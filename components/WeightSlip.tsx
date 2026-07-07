type Slip = {
  id: number;
  worker: string;
  checkRoll: string;
  cc: string;
  day: string;
  latexKg: number;
  scrapKg: number;
  drc: number;
};

export function WeightSlip({ slip }: { slip: Slip }) {
  return (
    <div className="mx-auto w-full max-w-sm border border-black bg-white p-4 text-black">
      <div className="text-center">
        <div className="text-sm font-bold uppercase tracking-wide">SFCK Estates</div>
        <div className="text-xs">Rubber Collection Centre Operations</div>
        <div className="mt-2 border-t border-b border-black py-1 text-sm font-semibold uppercase">
          Weight Slip
        </div>
      </div>

      <table className="mt-3 w-full text-xs">
        <tbody>
          <tr>
            <td className="py-1 font-medium">Slip No.</td>
            <td className="py-1 text-right">{slip.id}</td>
          </tr>
          <tr className="border-t border-dashed border-black/40">
            <td className="py-1 font-medium">Worker</td>
            <td className="py-1 text-right">{slip.worker}</td>
          </tr>
          <tr className="border-t border-dashed border-black/40">
            <td className="py-1 font-medium">Check Roll No.</td>
            <td className="py-1 text-right">{slip.checkRoll}</td>
          </tr>
          <tr className="border-t border-dashed border-black/40">
            <td className="py-1 font-medium">Collection Centre</td>
            <td className="py-1 text-right">{slip.cc}</td>
          </tr>
          <tr className="border-t border-dashed border-black/40">
            <td className="py-1 font-medium">Date</td>
            <td className="py-1 text-right">{slip.day}</td>
          </tr>
          <tr className="border-t border-black/60">
            <td className="py-1 font-medium">Latex (kg)</td>
            <td className="py-1 text-right">{slip.latexKg.toFixed(2)}</td>
          </tr>
          <tr className="border-t border-dashed border-black/40">
            <td className="py-1 font-medium">Scrap (kg)</td>
            <td className="py-1 text-right">{slip.scrapKg.toFixed(2)}</td>
          </tr>
          <tr className="border-t border-dashed border-black/40">
            <td className="py-1 font-medium">DRC</td>
            <td className="py-1 text-right">{(slip.drc * 100).toFixed(0)}%</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-3 border-t border-black pt-2 text-center text-xs">
        ✓ SMS sent to worker
      </div>
    </div>
  );
}
