if ('Summarizer' in self) {
    console.log("Summarizer API is supported");
}

// Proceed to request batch or streaming summarization
const summarizer = await Summarizer.create({
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Downloaded ${e.loaded * 100}%`);
    });
  }
});

// Batch summarization
async function runSummarizer(selectedText) {
  if (!('Summarizer' in self)) {
    console.warn("Summarizer API not supported");
    return null;
  }
  
  const longText = document.querySelector('article').innerHTML;
  const summary = await summarizer.summarize(longText, {
  context: 'This article is intended for a tech-savvy audience.',
});

// Check model availability before creating an instance
const availability = await Summarizer.availability();
if (availability === "unavailable") {
    console.warn("Model unavailable on this device");
    return null;
  }

// Create a summarizer instance with specific options
const summarizer = await Summarizer.create({
    type: "tldr",
    length: "short",
    format: "markdown",
    sharedContext: "Rewrite webpage text for clarity"
  });

  return await summarizer.summarize(selectedText);
}