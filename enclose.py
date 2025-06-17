import os
import tkinter as tk
from tkinter import filedialog, messagebox
from pathlib import Path

def get_code_files(directory):
    """Get all code files from directory and subdirectories"""
    # Define common code file extensions
    code_extensions = {
        '.py', '.js', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go',
        '.rs', '.kt', '.swift', '.m', '.h', '.hpp', '.scala', '.r', '.pl',
        '.sh', '.bat', '.ps1', '.html', '.css', '.scss', '.sass', '.less',
        '.xml', '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf',
        '.sql', '.md', '.tsx', '.jsx', '.vue', '.dart', '.lua', '.perl',
        '.asm', '.vb', '.fs', '.ml', '.clj', '.ex', '.exs', '.elm', '.hs'
    }
    
    code_files = []
    
    for root, dirs, files in os.walk(directory):
        # Skip hidden directories and common non-code directories
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', '__pycache__', 'venv', 'env']]
        
        for file in files:
            if any(file.endswith(ext) for ext in code_extensions):
                full_path = os.path.join(root, file)
                relative_path = os.path.relpath(full_path, directory)
                code_files.append((full_path, relative_path))
    
    return sorted(code_files, key=lambda x: x[1])

def combine_files(source_dir, output_file):
    """Combine all code files into a single text file"""
    code_files = get_code_files(source_dir)
    
    if not code_files:
        messagebox.showwarning("No Files Found", "No code files found in the selected directory.")
        return False
    
    try:
        with open(output_file, 'w', encoding='utf-8') as outfile:
            for i, (full_path, relative_path) in enumerate(code_files):
                # Write separator if not the first file
                if i > 0:
                    outfile.write('\n\n')
                
                # Start the code block
                outfile.write('```bash\n')
                # Write the file path
                outfile.write(f'{relative_path}\n')
                # Add two blank lines after the path
                outfile.write('\n\n')
                
                # Write the file content (still within the same code block)
                try:
                    with open(full_path, 'r', encoding='utf-8') as infile:
                        content = infile.read()
                        outfile.write(content)
                except Exception as e:
                    outfile.write(f'[Error reading file: {str(e)}]\n')
                    print(f"Error reading {relative_path}: {str(e)}")
                
                # Close the code block
                outfile.write('\n```')
        
        return True
    
    except Exception as e:
        messagebox.showerror("Error", f"Error writing output file: {str(e)}")
        return False

def main():
    """Main function to run the script"""
    # Create root window but hide it
    root = tk.Tk()
    root.withdraw()
    
    # Show dialog to select source directory
    source_dir = filedialog.askdirectory(
        title="Select folder containing code files"
    )
    
    if not source_dir:
        messagebox.showinfo("Cancelled", "No directory selected. Exiting.")
        return
    
    # Get list of files that will be processed (for preview)
    code_files = get_code_files(source_dir)
    file_count = len(code_files)
    
    if file_count == 0:
        messagebox.showwarning("No Files", "No code files found in the selected directory.")
        return
    
    # Show preview of files to be combined
    preview_msg = f"Found {file_count} code files. Continue?"
    if file_count <= 10:
        preview_msg += "\n\nFiles to be combined:\n" + "\n".join([f[1] for f in code_files[:10]])
    else:
        preview_msg += f"\n\nShowing first 10 files:\n" + "\n".join([f[1] for f in code_files[:10]])
        preview_msg += f"\n... and {file_count - 10} more files"
    
    if not messagebox.askyesno("Confirm", preview_msg):
        return
    
    # Show dialog to select output file
    output_file = filedialog.asksaveasfilename(
        title="Save combined file as",
        defaultextension=".txt",
        filetypes=[("Text files", "*.txt"), ("All files", "*.*")],
        initialfile="combined_code.txt"
    )
    
    if not output_file:
        messagebox.showinfo("Cancelled", "No output file selected. Exiting.")
        return
    
    # Combine the files
    messagebox.showinfo("Processing", f"Combining {file_count} files. This may take a moment...")
    
    if combine_files(source_dir, output_file):
        # Calculate output file size
        file_size = os.path.getsize(output_file)
        size_mb = file_size / (1024 * 1024)
        
        messagebox.showinfo(
            "Success", 
            f"Successfully combined {file_count} files!\n\n"
            f"Output file: {output_file}\n"
            f"File size: {size_mb:.2f} MB"
        )
    
    root.destroy()

if __name__ == "__main__":
    main()