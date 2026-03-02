{ pkgs, lib, ... }:

{
  languages.javascript = {
    enable = true;
    bun.enable = true;
  };

  languages.rust = {
    enable = true;
    channel = "nightly";
  };

  packages = with pkgs; [
    biome
  ];

  git-hooks.hooks = {
    # TypeScript / JavaScript
    biome.enable = true;

    # Rust - use devenv's nightly cargo
    cargo-check = {
      enable = true;
      name = "cargo-check";
      entry = "cargo fmt --check";
      types = [ "rust" ];
      pass_filenames = false;
      excludes = [ "^crates/brush-.*-vendored/" ];
    };
    clippy-check = {
      enable = true;
      name = "clippy-check";
      entry = "cargo clippy --all-features -- -D warnings";
      types = [ "rust" ];
      pass_filenames = false;
      excludes = [ "^crates/brush-.*-vendored/" ];
    };
  };

  enterShell = ''
    echo "oh-my-pi dev shell"
    echo "  bun dev    - run dev version"
    echo "  bun check  - type check + lint"
    echo "  bun test   - run tests"
  '';
}
