from optparse import OptionParser
import json

MAINJS_PATH = "js/global/common.js"
MANIFEST_PATH = "manifest.json"
DEV_URL = "http://127.0.0.1:8000"
PROD_URL = "https://getparseltongue.com"


def rewrite_baseurl(local):
    with open(MAINJS_PATH, "r+") as f:
        text = f.read()

        if local:
            text = text.replace(PROD_URL, DEV_URL)
        else:
            text = text.replace(DEV_URL, PROD_URL)

        f.seek(0)
        f.write(text)
        f.truncate()


def rewrite_manifest(local):

    with open(MANIFEST_PATH, "r+") as f:
        data = json.load(f)

        version = data["version"].split(".")
        version[2] = str(int(version[2]) + 1)
        version = ".".join(version)
        data["version"] = version

        permissions = data["permissions"]
        content_scripts = data["content_scripts"][0]
        matches = content_scripts.get("matches", [])

        if local:
            permissions.append(DEV_URL)
            matches.append(DEV_URL)
        else:
            permissions = _clean(permissions)
            matches = _clean(matches)

        content_scripts['matches'] = matches
        data["permissions"] = permissions

        f.seek(0)
        json.dump(data, f, indent=4, sort_keys=True)
        f.truncate()


def _clean(l):
    return [i for i in l if DEV_URL not in i]


def main(local):
    """"
        rewrite main.js to replace the baseUrl
        and update manifest.json to have a new manifest
    """

    rewrite_baseurl(local)
    rewrite_manifest(local)

if __name__ == "__main__":
    parser = OptionParser()

    parser.add_option("-l", "--local",
                      action="store_True", dest="local", default=False,
                      help="Set manifest to local settings.")

    (options, args) = parser.parse_args()
    main(options.local)
