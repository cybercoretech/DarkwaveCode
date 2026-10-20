const accountLink=document.querySelector('.sign-in');
if(accountLink){
  fetch('/api/auth/status',{credentials:'same-origin',cache:'no-store'})
    .then(response=>response.ok?response.json():null)
    .then(data=>{
      const user=data?.user;
      if(!user?.handle)return;
      const label=document.createElement('span');
      label.className='account-handle';
      label.textContent=`@${user.handle}`;
      accountLink.replaceChildren(label);
      if(user.isAdmin){
        const badge=document.createElement('small');
        badge.className='account-admin';
        badge.textContent='ADMIN';
        accountLink.append(badge);
        accountLink.dataset.admin='true';
      }
      const arrow=document.createElement('span');
      arrow.setAttribute('aria-hidden','true');
      arrow.textContent='↗';
      accountLink.append(arrow);
      accountLink.setAttribute('aria-label',`${user.handle} account${user.isAdmin?' · site admin':''}`);
    })
    .catch(()=>{});
}
