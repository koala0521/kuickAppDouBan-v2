// 测试 promise
function a(n){
    return new Promise((resolve , reject)=>{
        if( n < 2 ){
            setTimeout(()=>{
                resolve('a success')
            },5000)
        }else{
            reject('a error')
        }
    })
    .then(res => {
        console.log('n是小于2的');
        return n
        
    })
    .catch(err => {
        console.log('n是大于2的');
        return n
    });

}

function b(n){

    return new Promise((resolve , reject)=>{
        if( n < 4 ){
            resolve('b success')
        }else{
            reject('b error')
        }
    })    
    .then(res => {
        console.log('n是小于4的');
        return n
    })
    .catch(err => {
        console.log('n是大于4的');
        return n
    });

}

Promise.all( [ a(1) , b(4)] ).then( res =>{
    console.log('res' ,  res);

})

// setTimeout(()=>{
//     console.log('==========setTimeout==========================');
//     console.log('000');
//     console.log('===========setTimeout=========================');
// }, 2000)