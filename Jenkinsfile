pipeline {
  agent any
  stages {
    stage('prova stage') {
      steps {
        dir(path: './functions') {
          bat(script: 'echo %PATH%', returnStatus: true, returnStdout: true, encoding: 'utf-8')
        }

        cleanWs(cleanWhenNotBuilt: true, cleanWhenAborted: true, cleanWhenFailure: true, cleanWhenSuccess: true, cleanWhenUnstable: true, cleanupMatrixParent: true, deleteDirs: true, notFailBuild: true)
      }
    }
  }
  environment {
    Path = '%PATH%'
  }
}