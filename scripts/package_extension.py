"""
Packages the SelfHire.ai Chrome Extension into a production-ready ZIP archive.
Destination: dist/selfhire-extension.zip
"""

import os
import zipfile

def package_extension():
    source_dir = os.path.join("apps", "extension")
    dist_dir = "dist"
    os.makedirs(dist_dir, exist_ok=True)
    zip_path = os.path.join(dist_dir, "selfhire-extension.zip")

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                abs_path = os.path.join(root, file)
                rel_path = os.path.relpath(abs_path, source_dir)
                zf.write(abs_path, rel_path)

    size_kb = os.path.getsize(zip_path) / 1024
    print(f"Extension packaged successfully: {zip_path} ({size_kb:.1f} KB)")
    return zip_path

if __name__ == "__main__":
    package_extension()
