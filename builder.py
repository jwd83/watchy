import shutil
import os
import json

def main():
    # clean dist/ folder?
    clean_dist_folder()

    # change version?
    ver = change_version()

    # perform build
    build()

    release_to_github()
    
    
def release_to_github():
    release = input("Release to GitHub? (y/n): ").lower()
    

def change_version():
    # display current version in package.json
    with open('package.json', 'r') as f:
        package_data = json.load(f)
    current_version = package_data.get('version', '0.0.0')
    print(f"Current version: {current_version}")
    if input("Change version? (y/n): ").lower() == 'y':
        new_version = input("Enter new version (e.g., 1.2.3): ")
        package_data['version'] = new_version
        with open('package.json', 'w') as f:
            json.dump(package_data, f, indent=2)
        print(f"Version updated to: {new_version}")

        return new_version
    else:
        return current_version


def build():

    if os.name == 'nt':
        build_windows()

    if os.name == 'posix':
        build_macos()

def clean_dist_folder():
    if input("Clean dist/ folder? (y/n): ").lower() == 'y':
        if os.path.exists('dist'):
            shutil.rmtree('dist')
            print("dist/ folder cleaned.")
        else:
            print("dist/ folder does not exist, nothing to clean.")
        os.makedirs('dist')
        os.makedirs('release')
        print("dist/ folder created.")

def build_macos():
    print("Building for macOS...")
    os.system('npm run build:mac')

    # copy the built .dmg to release/
    dist_files = os.listdir('dist')
    for file in dist_files:
        if file.endswith('.dmg'):
            shutil.copy(os.path.join('dist', file), 'release/')
            print(f"Copied {file} to release/")





def build_windows():
    print("Building for Windows...")
    os.system('npm run build:win')


if __name__ == "__main__":
    main()