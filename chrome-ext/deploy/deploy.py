import json

MAINJS_PATH = "js/global/common.js"
MANIFEST_PATH = "manifest.json"
DEV_URL = "http://127.0.0.1:8000"
PROD_URL = "https://getparseltongue.com"


def rewriteBaseUrl():
    with open(MAINJS_PATH, "r+") as f:
        text = f.read()
        text = text.replace(DEV_URL, PROD_URL)
        f.seek(0)
        f.write(text)
        f.truncate()


def rewriteManifest():

    with open(MANIFEST_PATH, "r+") as f:
        data = json.load(f)

        version = data["version"].split(".")
        version[2] = str(int(version[2]) + 1)
        version = ".".join(version)
        data["version"] = version

        permissions = data["permissions"]
        permissions = [perm for perm in permissions if DEV_URL not in perm]
        data["permissions"] = permissions

        content_scripts = data["content_scripts"][0]
        matches = content_scripts.get('matches', [])
        matches = [match for match in matches if DEV_URL not in match] 
        content_scripts["matches"] = matches

        f.seek(0)
        json.dump(data, f, indent=4, sort_keys=True)
        f.truncate()


def main():
    """"
        rewrite main.js to replace the baseUrl
        and update manifest.json to have a new manifest
    """

    rewriteBaseUrl()

    rewriteManifest()

if __name__ == "__main__":
    main()
