
// 测试 promise
function a(m){
    return new Promise((resolve , reject)=>{
        if( m < 2 ){
            setTimeout(()=>{
                resolve({data:{a:1}})
            },100)
        }else{
            reject('a error')
        }
    })
    .then(res => {
        console.log('m是小于2的'  , res );
        return m
        
    })
    .catch(err => {
        console.log('m是大于2的' , err );
        return m
    });

}

function b(n){

    return new Promise((resolve , reject)=>{
        if( n > 4 ){
            resolve('b success')
        }else{
            reject('b error')
        }
    })    
    .then(res => {
        console.log('n是大于4的' , n );
        return n
    })
    .catch(err => {
        console.log('n是小于4的' , n);
        return b(++n)
    });

}

console.log('1');  
a(1)
.then(res =>{
    console.log('then');    
})

console.log(2);  


Promise.all( [ a(1) , b(1)] ).then( res =>{
    console.log('res' ,  res);

})

// setTimeout(()=>{
//     console.log('==========setTimeout==========================');
//     console.log('000');
//     console.log('===========setTimeout=========================');
// }, 2000)