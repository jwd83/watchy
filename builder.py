import shutil
import os
import json
import subprocess

def main():
    # clean dist/ folder?
    clean_dist_folder()

    # change version?
    ver = change_version()

    # perform build
    build()

    release_to_github(ver)
    
    
def release_to_github(version: str):
    """Create or update a GitHub release for the given version using the gh CLI.

    Behaviour:
    - If a release with tag v<version> exists, upload assets with --clobber
    - If it does not exist, create a new release with those assets
    - Only upload artifacts that match this version from the local release/ folder
    """
    release = input("Release to GitHub? (y/n): ").strip().lower()
    if release != 'y':
        print("Skipping GitHub release.")
        return

    tag = f"v{version}"
    release_dir = 'release'

    if not os.path.isdir(release_dir):
        print(f"No '{release_dir}' directory found, nothing to release.")
        return

    # Only pick artifacts that contain the version in their filename so we
    # don't accidentally push artifacts from other versions.
    artifacts = []
    for fname in os.listdir(release_dir):
        full_path = os.path.join(release_dir, fname)
        if os.path.isfile(full_path) and version in fname:
            artifacts.append(full_path)

    if not artifacts:
        print(f"No artifacts in '{release_dir}' for version {version}, aborting release.")
        return

    print(f"Preparing to publish {len(artifacts)} artifact(s) for tag {tag}:")
    for a in artifacts:
        print(f"  - {a}")

    # Check whether the release already exists.
    print(f"Checking if GitHub release {tag} exists...")
    view_result = subprocess.run([
        'gh', 'release', 'view', tag
    ])

    if view_result.returncode == 0:
        # Release exists: upload and clobber matching assets.
        print(f"Release {tag} exists. Uploading assets with --clobber...")
        cmd = ['gh', 'release', 'upload', tag, '--clobber', *artifacts]
    else:
        # Release does not exist: create it with these assets.
        print(f"Release {tag} does not exist. Creating new release...")
        title = f"watchy {version}"
        notes = f"Automated release for version {version}."
        cmd = ['gh', 'release', 'create', tag, *artifacts,
               '--title', title,
               '--notes', notes]

    result = subprocess.run(cmd)
    if result.returncode == 0:
        print(f"GitHub release {tag} published successfully.")
    else:
        print(f"Failed to publish GitHub release {tag}. gh exited with {result.returncode}.")

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

    # Ensure release/ exists
    os.makedirs('release', exist_ok=True)

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