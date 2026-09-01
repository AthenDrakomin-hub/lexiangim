//go:build windows

package lumberjack

import (
	"os"
)

// osChown is a var so we can mock it out during tests.
var osChown = os.Chown

// chown on Windows is a no-op since Windows does not have Unix-style file ownership.
func chown(name string, info os.FileInfo) error {
	return nil
}
