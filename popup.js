// logic for interacting with popup ui and typing

document.getElementById('submitButton').addEventListener('click', async () => {
  const prompt = document.getElementById('userInput').value;
  const tone = document.getElementById('toneSelector')?.value || 'default';

  if (!prompt.trim()) {
    document.getElementById('output').innerText = 'Please enter a prompt.';
    return;
  }

  document.getElementById('output').innerText = 'Improving...';

  try {
    const improvedPrompt = await getImprovedPrompt(prompt, tone);
    document.getElementById('output').innerText = improvedPrompt || 'No improvement returned.';
  } catch (err) {
    console.error('Error:', err);
    document.getElementById('output').innerText = 'Something went wrong.';
  }
});

async function getImprovedPrompt(prompt, tone) {
  // ✅ Mocked API response
  await new Promise(resolve => setTimeout(resolve, 800));
  return `[${tone.toUpperCase()} VERSION] ${prompt} (improved)`;
}