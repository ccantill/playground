import {MockTree} from "./mocktree";
import {I18NResource, I18NWorkspace} from "./i18n";

test('discovers the correct resources', async () => {
  let i18NWorkspace = await I18NWorkspace.load(new MockTree({
    "i18n.config.json": JSON.stringify({
          "resources": [
            {
              "filePathPattern": "locales/(?<locale>[a-z]{2}(-[A-Z]{2})?)/(?<namespace>.*).json",
              "format": "i18next_v1"
            }
          ]
        }
    ),
    "locales": {
      "en": {
        "common.json": "{}",
        "specific.json": "{}",
        "unused.properties": ""
      },
      "nl": {
        "common.json": "{}"
      }
    }
  }));
  expect(i18NWorkspace.resources).toContainEqual(new I18NResource("locales/en/common.json", "en", "common", "i18next_v1"))
  expect(i18NWorkspace.resources).toContainEqual(new I18NResource("locales/en/specific.json", "en", "specific", "i18next_v1"))
  expect(i18NWorkspace.resources).toContainEqual(new I18NResource("locales/nl/common.json", "nl", "common", "i18next_v1"))

  expect(i18NWorkspace.locales).toEqual(new Set(["en", "nl"]))
  expect(i18NWorkspace.namespaces).toEqual(new Set(["common", "specific"]))
})

test('discovers compound namespaces', async () => {
  let i18NWorkspace = await I18NWorkspace.load(new MockTree({
    "i18n.config.json": JSON.stringify({
          "resources": [
            {
              "filePathPattern": "packages/(?<namespace>.*)/locales/(?<locale>[a-z]{2}(-[A-Z]{2})?)/(?<namespace>.*).json",
              "format": "i18next_v1"
            }
          ]
        }
    ),
    "packages": {
      "frontend": {
        "locales": {
          "en": {
            "common.json": "{}",
            "specific.json": "{}",
            "unused.properties": ""
          },
          "nl": {
            "common.json": "{}"
          }
        }
      },

      "backend": {
        "locales": {
          "en": {
            "common.json": "{}"
          },
          "nl": {
            "common.json": "{}"
          }
        }
      }
    }
  }));
  expect(i18NWorkspace.resources).toContainEqual(new I18NResource("packages/frontend/locales/en/common.json", "en", "frontend:common", "i18next_v1"))
  expect(i18NWorkspace.resources).toContainEqual(new I18NResource("packages/frontend/locales/en/specific.json", "en", "frontend:specific", "i18next_v1"))
  expect(i18NWorkspace.resources).toContainEqual(new I18NResource("packages/frontend/locales/nl/common.json", "nl", "frontend:common", "i18next_v1"))
  expect(i18NWorkspace.resources).toContainEqual(new I18NResource("packages/backend/locales/en/common.json", "en", "backend:common", "i18next_v1"))
  expect(i18NWorkspace.resources).toContainEqual(new I18NResource("packages/backend/locales/nl/common.json", "nl", "backend:common", "i18next_v1"))

  expect(i18NWorkspace.locales).toEqual(new Set(["en", "nl"]))
  expect(i18NWorkspace.namespaces).toEqual(new Set(["backend:common", "frontend:common", "frontend:specific"]))
})
