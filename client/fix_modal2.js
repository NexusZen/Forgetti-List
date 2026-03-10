const fs = require('fs');
let lines = fs.readFileSync('src/components/ListDetails.jsx', 'utf8').split(/\r?\n/);
let outputLines = [];
let i = 0;
while(i < lines.length) {
  if (lines[i].includes('            {/* Score / Completion Modal */}')) {
     outputLines.push(lines[i]); // Keep this line
     
     // add our custom lines
     outputLines.push('            {showScoreModal && (');
     outputLines.push('                <div className={modal-overlay }>');
     outputLines.push('                    <div className="score-modal-content" style={{ background: \\'transparent\\', boxShadow: \\'none\\', textAlign: \\'center\\', padding: \\'1rem\\', display: \\'flex\\', flexDirection: \\'column\\', alignItems: \\'center\\' }}>');
     outputLines.push('                        <div style={{ marginBottom: \\'1.5rem\\' }}>');
     outputLines.push('                            <img src={scoreArtwork} alt="Result" style={{ maxWidth: \\'350px\\', maxHeight: \\'250px\\', objectFit: \\'contain\\' }} />');
     outputLines.push('                        </div>');
     outputLines.push('                        <div style={{ marginBottom: \\'0.5rem\\' }}>');
     outputLines.push('                            <ScoreGauge percentage={(scoreStats.solved / scoreStats.total) * 100} />');
     outputLines.push('                        </div>');
     outputLines.push('                        <div className="score-stats" style={{ display: \\'flex\\', justifyContent: \\'center\\', gap: \\'2.5rem\\', marginBottom: \\'1.5rem\\', background: \\'transparent\\', padding: 0, boxShadow: \\'none\\' }}>');
     outputLines.push('                            <div className="stat-item" style={{ textAlign: \\'center\\', background: \\'transparent\\', boxShadow: \\'none\\' }}>');
     outputLines.push('                                <span className="stat-value" style={{ color: \\'#10B981\\', display: \\'block\\', fontSize: \\'1.25rem\\', fontWeight: \\'bold\\' }}>{scoreStats.solved}</span>');
     outputLines.push('                                <span className="stat-label" style={{ fontSize: \\'0.65rem\\', color: \\'#6B7280\\', textTransform: \\'uppercase\\', fontWeight: 600 }}>SOLVED</span>');
     outputLines.push('                            </div>');
     outputLines.push('                            <div className="stat-item" style={{ textAlign: \\'center\\', background: \\'transparent\\', boxShadow: \\'none\\' }}>');
     outputLines.push('                                <span className="stat-value" style={{ color: \\'#EF4444\\', display: \\'block\\', fontSize: \\'1.25rem\\', fontWeight: \\'bold\\' }}>{scoreStats.failed}</span>');
     outputLines.push('                                <span className="stat-label" style={{ fontSize: \\'0.65rem\\', color: \\'#6B7280\\', textTransform: \\'uppercase\\', fontWeight: 600 }}>FAILED</span>');
     outputLines.push('                            </div>');
     outputLines.push('                        </div>');
     outputLines.push('                        <div style={{ marginBottom: \\'1.5rem\\' }}>');
     outputLines.push('                            <h3 style={{ margin: 0, color: \\'var(--text-dark)\\', display: \\'flex\\', alignItems: \\'center\\', justifyContent: \\'center\\', gap: \\'0.2rem\\', fontSize: \\'1.8rem\\', fontWeight: \\'bold\\' }}>');
     outputLines.push('                                <span style={{ color: \\'#8B5CF6\\', fontSize: \\'1.2rem\\', alignSelf: \\'flex-start\\', marginTop: \\'0.2rem\\' }}>+</span>');
     outputLines.push('                                {scoreStats.pointsEarned || 0} Points');
     outputLines.push('                            </h3>');
     outputLines.push('                        </div>');
     outputLines.push('                        <button className="btn-close-score" style={{ background: \\'#8B5CF6\\', color: \\'white\\', border: \\'none\\', borderRadius: \\'24px\\', padding: \\'0.8rem 3.5rem\\', fontSize: \\'1.1rem\\', cursor: \\'pointer\\', transition: \\'background 0.2s\\', fontWeight: \\'bold\\', marginTop: \\'0.5rem\\' }} onMouseOver={(e) => e.currentTarget.style.background = \\'#7C3AED\\'} onMouseOut={(e) => e.currentTarget.style.background = \\'#8B5CF6\\'} onClick={onBack}>Go back</button>');
     outputLines.push('                    </div>');
     outputLines.push('                </div>');
     outputLines.push('            )}');

     // skip forward existing lines until we reach         </div> 
     // line 376 is {/* Score / Completion Modal */}, line 419 is         </div>
     let j = i + 1;
     while(j < lines.length && !lines[j].includes('        </div>')) {
        j++;
     }
     i = j; // we are now at '        </div>'
  } else {
     outputLines.push(lines[i]);
     i++;
  }
}
fs.writeFileSync('src/components/ListDetails.jsx', outputLines.join('\\n'));
console.log('Update Complete.');
