import axios, { AxiosResponse } from 'axios'
import { compile } from 'json-schema-to-typescript'
import * as rimraf from 'rimraf'
import { writeFileSync } from 'fs'
import { join } from 'path'
import * as fs from 'fs'

const directory = 'lib'
const schemaUrlPattern: string = 'https://raw.githubusercontent.com/docker/compose/master/compose/config/config_schema_v{version}.json'
const schemaVersions: string[] = ['1', '2.0', '2.1', '2.2', '2.3', '2.4', '3.0', '3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8']

rimraf.sync(directory)
fs.mkdirSync(directory)

const promises: Promise<{ compile: string, version: string }>[] = []
for (const version of schemaVersions) {
  const url = schemaUrlPattern.replace('{version}', version)
  promises.push(axios.get(url).then((response: AxiosResponse) => {
    return { compilePromise: compile(response.data, `docker-compose-spec-v${version}.ts`), version }
  }).then((compilePromiseAndVersion: { compilePromise: Promise<string>, version: string }) => {
    return compilePromiseAndVersion.compilePromise.then((compile: string) => {
      return { compile, version }
    })
  }).then((compileAndVersion: { compile: string, version: string }) => {
    writeFileSync(join(directory, `docker-compose-spec-v${version}.ts`), compileAndVersion.compile)
    return compileAndVersion
  }))
}

Promise.all(promises).then((resolved: { compile: string, version: string }[]) => {
  console.log(`${resolved.length} files written in ${directory}.`)
}).catch((err) => {
  console.error(err)
  process.exit(-1)
})








