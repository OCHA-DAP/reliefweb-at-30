<script>
  import { asset } from '$app/paths';

  // Served from static/ through asset(), so the paths hold under a subpath
  // such as /reliefweb-at-30/ on GitHub Pages.
  const rwLogo = asset('/reliefweb-logo.svg');
  const ochaLogo = asset('/ocha-logo.svg');

  // The ReliefWeb and OCHA logos in their official colors, on the white page.
  // `small` is the repeat at the foot of the close.
  let { small = false } = $props();
</script>

<div class="logos" class:small>
  <a href="https://reliefweb.int" target="_blank" rel="noopener"><img src={rwLogo} alt="ReliefWeb" class="logo rw" /></a>
  <a href="https://www.unocha.org" target="_blank" rel="noopener"><img src={ochaLogo} alt="OCHA" class="logo ocha" /></a>
</div>

<style>
  .logos {
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 0 0 20px;
  }
  .logos a + a {
    padding-left: 14px;
    border-left: 1px solid var(--rule-strong);
  }
  .logo {
    display: block;
    width: auto;
  }
  .logo.rw {
    height: 40px;
  }
  .logo.ocha {
    height: 27px;
  }
  .small .logo.rw {
    height: 32px;
  }
  .small .logo.ocha {
    height: 22px;
  }
  .small {
    gap: 12px;
  }
  @media (max-width: 699px) {
    .logos:not(.small) .logo.rw {
      height: 34px;
    }
    .logos:not(.small) .logo.ocha {
      height: 23px;
    }
  }
  .small a + a {
    padding-left: 12px;
  }
</style>
