// Handle drag-and-drop
function setupDropZone(dropId, inputId, fileType) {
  const dropZone = document.getElementById(dropId);
  const input = document.getElementById(inputId);

  dropZone.addEventListener("click", () => input.click());

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (fileType === "jpg" && file.type !== "image/jpeg") {
      alert("Please drop a JPG file.");
      return;
    }
    if (fileType === "pdf" && file.type !== "application/pdf") {
      alert("Please drop a PDF file.");
      return;
    }

    input.files = e.dataTransfer.files;
  });
}

// Setup both zones
setupDropZone("jpgDrop", "jpgInput", "jpg");
setupDropZone("pdfDrop", "pdfInput", "pdf");

// JPG Compressor
function compressJPG() {
  const input = document.getElementById("jpgInput").files[0];
  const quality = document.getElementById("jpgQuality").value / 100;

  if (!input) {
    alert("Please select a JPG file first!");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.src = e.target.result;

    img.onload = function() {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        const link = document.getElementById("jpgDownload");
        link.href = URL.createObjectURL(blob);
        link.style.display = "inline-block";
      }, "image/jpeg", quality);
    };
  };
  reader.readAsDataURL(input);
}

// PDF Compressor
async function compressPDF() {
  const input = document.getElementById("pdfInput").files[0];
  const scale = parseFloat(document.getElementById("pdfScale").value);

  if (!input) {
    alert("Please select a PDF file first!");
    return;
  }

  const arrayBuffer = await input.arrayBuffer();
  const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

  const newPdf = await PDFLib.PDFDocument.create();
  const pages = await newPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    page.setSize(width * scale, height * scale);
    newPdf.addPage(page);
  });

  const compressedPdf = await newPdf.save();
  const blob = new Blob([compressedPdf], { type: "application/pdf" });
  const link = document.getElementById("pdfDownload");
  link.href = URL.createObjectURL(blob);
  link.style.display = "inline-block";
}
