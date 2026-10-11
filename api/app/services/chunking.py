def split_text(text: str, size: int = 800, overlap: int = 150) -> list[str]:
    text = " ".join(text.split())  # normalise les espaces et sauts de ligne
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + size, len(text))
        if end < len(text):
            # coupe sur un espace pour ne pas casser un mot
            cut = text.rfind(" ", start + size // 2, end)
            if cut != -1:
                end = cut
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(text):
            break
        start = max(end - overlap, start + 1)
    return chunks