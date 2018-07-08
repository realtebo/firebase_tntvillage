pipeline {
  agent any
  stages {
    stage('prova stage') {
      steps {
        dir(path: './functions') {
          bat(script: 'npm run limt', returnStatus: true, returnStdout: true)
        }

        cleanWs(cleanWhenNotBuilt: true, cleanWhenAborted: true, cleanWhenFailure: true, cleanWhenSuccess: true, cleanWhenUnstable: true, cleanupMatrixParent: true, deleteDirs: true, notFailBuild: true)
      }
    }
  }
}