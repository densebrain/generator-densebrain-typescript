'use strict'
require('shelljs/global')

const
  yeoman = require('yeoman-generator'),
  chalk = require('chalk'),
  yosay = require('yosay'),
  path = require('path'),
  assert = require("assert")

const
  defaultName = path.basename(process.cwd())

module.exports = yeoman.Base.extend({
  prompting: function () {
    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the superb ' + chalk.red('generator-densebrain-typescript') + ' generator!'
    ))
    
    const
      prompts = [{
        type: 'input',
        name: 'name',
        message: `What's the name of this radical project?`,
        default: defaultName
      }, {
        type: 'confirm',
        name: 'initGit',
        message: `Init git repo?`,
        default: true
      }]
    
    return this.prompt(prompts).then(function (props) {
      // To access props later use this.props.someAnswer
      this.props = props
      if (!props.initGit)
        return
      
      return this.prompt([
        {
          
          type: 'confirm',
          name: 'pushToGitHub',
          message: `Push to GitHub?`,
          default: true
        }
      ]).then(moreProps => {
        if (!moreProps.pushToGitHub)
          return
        
        return this.prompt([
          {
            type: 'input',
            name: 'githubAccount',
            message: `Github Account?`,
            default: exec('whoami').stdout.trim()
          }, {
            type: 'confirm',
            name: 'isPrivate',
            message: `Is this project private?`,
            default: true
          }
        ]).then(finalProps => {
          Object.assign(this.props,moreProps,finalProps)
        })
      })
      
      
    }.bind(this))
  },
  
  writing: function () {
    const
      {name, initGit, pushToGit, isPrivate} = this.props
  
    /**
     * Copy Templates
     */
    this.fs.copyTpl(
      this.templatePath('**/*'),
      this.destinationPath(), {
        name,
        indexContent: `export * from "${name}"`
      }
    )
  
    /**
     * Create gitignore +++
     */
    this.fs.write(this.destinationPath(`.gitignore`), `
# NODE
node_modules

# BUILD
dist

# IDEA
workspace.xml
misc.xml

# LOGS
*.log
`)
    
    
    // index.ts
    this.fs.write(this.destinationPath(`src/index.ts`),
      `export * from "./${name}"`)
    
    // ${name}.ts
    this.fs.write(this.destinationPath(`src/${name}.ts`),
      `export default function myfunc() { return true } `)
    
    // ${name}.spec.ts
    this.fs.write(this.destinationPath(`src/test/${name}.spec.ts`), `
import myfunc from "../${name}"

test('An empty test',() => {
  expect(myfunc()).toBe(true)
})`)
    
  },
  
  
  installingAllModules: function () {
    this.npmInstall([
      'typescript@next',
      'tslint',
      'eslint',
      'babel-eslint',
      'ts-jest',
      'jest',
      '@types/lodash',
      '@types/node',
      '@types/jest',
      'gulp'
    ], {'save-dev': true})
    this.npmInstall(['lodash', 'typelogger'], {'save': true})
    
  },
  
  install: function () {
    this.installDependencies()
  },
  
  end() {
    const
      {name, initGit, githubAccount, pushToGitHub, isPrivate} = this.props
    
    if (!initGit)
      return
    
    cd(this.destinationPath())
    exec(`git init`)
    exec(`git add -A`)
    exec(`git commit -m "Initial import"`)
    
    if (!pushToGitHub)
      return
    
    const
      repo = `${githubAccount}/${name}`
    
    echo(`Creating repo: ${repo}`)
    assert(
      exec(`hub create ${isPrivate ? '-p' : ''} ${repo}`).code === 0,
      `Repo create failed for ${repo}`
    )
    
    exec(`git push origin master`)
    
  }
})
