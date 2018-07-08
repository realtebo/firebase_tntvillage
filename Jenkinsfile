pipeline {
  agent any
  stages {
    stage('prova stage') {
      steps {
        dir(path: './functions') {
          sh 'npm i nohup -g'
          sh 'npm install'
          sh 'node run lint'
          sh 'node run build'
          cleanWs(cleanWhenNotBuilt: true, cleanWhenAborted: true, cleanWhenFailure: true, cleanWhenSuccess: true, cleanWhenUnstable: true, cleanupMatrixParent: true, deleteDirs: true, notFailBuild: true)
        }

      }
    }
  }
}