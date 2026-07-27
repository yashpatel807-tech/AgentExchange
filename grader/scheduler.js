const cron = require('node-cron');
const { runGrader } = require('./runner');

const INTERVAL = process.env.GRADER_INTERVAL_MINUTES || 60;

cron.schedule('*/' + INTERVAL + ' * * * *', async () => {
  console.log('[' + new Date().toISOString() + '] Running scheduled grader...');
  try {
    const results = await runGrader({ all: true });
    console.log('[' + new Date().toISOString() + '] Scheduled grading complete: ' + results.length + ' tools');
  } catch (e) {
    console.error('[' + new Date().toISOString() + '] Scheduled grading failed:', e.message);
  }
});

console.log('Grader scheduler started. Running every ' + INTERVAL + ' minutes.');
