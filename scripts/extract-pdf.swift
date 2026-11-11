import Foundation
import PDFKit
import Vision
import AppKit

guard CommandLine.arguments.count == 3 else {
    fputs("Usage: extract-pdf <input.pdf> <output.txt>\n", stderr)
    exit(2)
}

let input = URL(fileURLWithPath: CommandLine.arguments[1])
let output = URL(fileURLWithPath: CommandLine.arguments[2])
guard let document = PDFDocument(url: input) else {
    fputs("Could not open PDF\n", stderr)
    exit(1)
}

var pages: [String] = []
for index in 0..<document.pageCount {
    guard let page = document.page(at: index) else { continue }
    let text = page.string?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    var pageOutput = "=== Page \(index + 1) ===\n\(text)"

    // Candidate scripts in this PDF are often scanned images rather than selectable text.
    if index >= 7 {
        let thumbnail = page.thumbnail(of: NSSize(width: 1800, height: 2400), for: .mediaBox)
        if let image = thumbnail.cgImage(forProposedRect: nil, context: nil, hints: nil) {
            let request = VNRecognizeTextRequest()
            request.recognitionLevel = .accurate
            request.usesLanguageCorrection = true
            let handler = VNImageRequestHandler(cgImage: image)
            do {
                try handler.perform([request])
                let recognized = (request.results ?? []).compactMap { $0.topCandidates(1).first?.string }
                if !recognized.isEmpty {
                    pageOutput += "\n\n[OCR of page image; may duplicate selectable text and may contain recognition errors]\n"
                    pageOutput += recognized.joined(separator: "\n")
                }
            } catch {
                pageOutput += "\n\n[Image-based candidate response not transcribed automatically; inspect original PDF page \(index + 1).]"
            }
        }
    }
    pages.append(pageOutput)
}
try pages.joined(separator: "\n\n").write(to: output, atomically: true, encoding: .utf8)
print("Extracted \(document.pageCount) pages to \(output.path)")
